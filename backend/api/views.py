import requests
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated,BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from coinapp.models import Listing,Exchange, ExpoPushToken
from coinapp.misc import CATEGORIES
from . import serializers
from .utils import get_transaction_queryset, save_transaction, UsernameRateThrottle

User = get_user_model()

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Object-level permission to only allow owners of an object to edit it.
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user

class CustomAuthToken(ObtainAuthToken):
    throttle_classes = [UsernameRateThrottle]

    def post(self, request, *args, **kwargs):
        inactive_user = User.objects.filter(
            username=request.data["username"], is_active=False
        ).first()
        if inactive_user:
            if inactive_user and inactive_user.check_password(request.data["password"]):
                return Response(
                    {"is_active": False, "message": "Verification is pending."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)
        pushtoken = request.data.get('expoPushToken')
        if pushtoken:
            ExpoPushToken.objects.filter(token=pushtoken).exclude(user=user).delete()
            ExpoPushToken.objects.update_or_create(user=user,defaults={'token': pushtoken})
        return Response(
            {
                "key": token.key,
                "user_id": user.pk,
                "firstname":user.first_name,
                "username": user.username,
                "exchange": user.exchange_id,
                "exchange_name":user.exchange.name,
            }
        )

class AjaxView(APIView):
    def get(self, request, format=None):
        purpose = request.GET.get("purpose")
        resp = {"status": "success", "data": ""}
        if purpose == "stackcoinai":
            # resp = github_models_api(request.GET.get("details"))
            resp["data"] = purpose
        elif purpose == "userbalance":
            if request.user.is_authenticated:
                resp["data"] = request.user.balance
        elif purpose == "categories":
            resp["data"] = CATEGORIES
        elif purpose == "exchanges":
            resp["data"] = [
                (e.id, f"{e.name}\n{e.get_country_and_subdivision()},{e.postal_code}")
                for e in Exchange.objects.all()
            ]
        elif purpose == "logout":
            if request.user.is_authenticated:
                Token.objects.get(user=request.user).delete()
                resp["data"] = "Successfully logged out."
        if resp["data"] == "":
            return Response({"status": "error"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resp)        

class CreateUserView(CreateAPIView):
    model = User
    serializer_class = serializers.UserCreateSerializer


class UserReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.UserSerializer
    pagination_class = None
    def get_queryset(self):
        return User.objects.filter(exchange=self.request.user.exchange
            ).order_by("first_name")

class ListingModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        request = self.request
        user = self.request.user
        qs = Listing.objects.filter(user__exchange=user.exchange)
        if self.action == "list":
            listing_type = request.query_params.get("type", "O")
            qs = qs.filter(listing_type=listing_type)
            user_id = request.query_params.get("user")
            if user_id=='all':
                # listings of all users
                return qs.filter(is_active=True).order_by("-created_at")
            # listings of a user
            user_id = int(user_id)
            qs = qs.filter(user_id=user_id)
            if user_id != user.id:
                # don't show inactive lisiting
                qs=qs.filter(is_active=True)
        return qs.order_by("-created_at")
        
    def get_serializer_class(self):
        if self.action == "list":
            return serializers.ListingListSerializer
        if self.action == "create":
            return serializers.ListingCreateSerializer
        return serializers.ListingDetailSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class Transactions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = User.objects.filter(id=self.request.GET["user"],exchange=request.user.exchange).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_400_BAD_REQUEST)
        qs = get_transaction_queryset(user)
        serializer = serializers.TransactionSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        transaction_type = "buyer"  # request.data["transaction_type"] # buyer or seller
        amt = request.data["amount"]
        desc = request.data["message"]
        # default is seller transaction(receive money)
        seller = request.user
        buyer = User.objects.get(id=request.data["user"])
        response_data = save_transaction(transaction_type, amt, desc, seller, buyer)
        if response_data["success"]:
            serializer = serializers.TransactionSerializer(response_data["txn_obj"])
            notification_user = serializer.data['buyer']
            txn_from = serializer.data['seller_name']
            if transaction_type == "buyer":
                notification_user=serializer.data['seller']
                txn_from = serializer.data['buyer_name']
            send_push_notification(receiver_id=notification_user,title="New Transaction",
                body=f"New trasaction from {txn_from}",data={"txn_id": serializer.data['id']})
            return Response(serializer.data)
        return Response(response_data["msg"], status=status.HTTP_400_BAD_REQUEST)

class VerifyUserView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):  
        candidate = User.objects.get(id=request.data["candidate_id"])
        if candidate.is_active:
            return Response(
                {"detail": "Verification already done."}, status=status.HTTP_400_BAD_REQUEST
            )
        if request.user.exchange != candidate.exchange:
            return Response(
                {"detail": f"You can only verify users on exchange {request.user.exchange}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        candidate.is_active = True
        candidate.save()
        return Response(
            {"detail": "Verification successful."}, status=status.HTTP_201_CREATED
        )
        
def send_push_notification(receiver_id, title, body, data=None):
    obj = ExpoPushToken.objects.filter(user_id=receiver_id).first()
    if obj:
        token = obj.token
        message = {"to": token,"sound": "default",'title':title,'body': body,'data':data}
        response = requests.post("https://exp.host/--/api/v2/push/send",json=message,
            headers={"Accept": "application/json","Content-Type": "application/json",})
        print(response.json())
