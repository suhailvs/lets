import requests
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from coinapp.models import Listing, UserVerification, Exchange, ExpoPushToken
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
    def get_queryset(self):
        return User.objects.order_by("first_name")

class ExchangeUserReadOnlyViewset(UserReadOnlyViewSet):
    # to list users in home page
    pagination_class = None
    def get_queryset(self):
        return User.objects.filter(exchange=self.request.user.exchange).order_by("first_name")

class ListingModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        request = self.request
        user = self.request.user
        qs = Listing.objects.all() #.filter(user__exchange=user.exchange)
        if self.action == "list":
            listing_type = request.query_params.get("type", "O")
            qs = qs.filter(listing_type=listing_type)
                
            user_id = request.query_params.get("user")
            if user_id=='all':
                # listings of all users
                return qs.order_by("-created_at")
            
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
        user = User.objects.get(id=self.request.GET["user"])
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
            return Response(serializer.data)
        return Response(response_data["msg"], status=status.HTTP_400_BAD_REQUEST)


class VerifyUserView(APIView):
    permission_classes = [IsAuthenticated]

    def is_trusted_user(self, user):
        # total_active_users_in_exchange = User.objects.filter(is_active=True,exchange=user.exchange).count()
        # (total users, min_verification) -> (1, 1), (2, 2), (3, 2), (4, 3), (5, 3), (6, 4), (7, 4), (8, 5), (9, 5)
        min_verifications = 1  # (total_active_users_in_exchange//2)+1
        verifications = UserVerification.objects.filter(candidate=user)
        return verifications.count() >= min_verifications

    def activate_user(self, user):
        if not user.is_active:
            if self.is_trusted_user(user):
                user.is_active = True
                user.save()

    def post(self, request):
        if not request.user.is_active:
            return Response(
                {"detail": "Your Account is not active."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        candidate = User.objects.get(id=request.data["candidate_id"])
        if request.user.exchange != candidate.exchange:
            return Response(
                {
                    "detail": f"You can only verify users on exchagne {request.user.exchange}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if request.user == candidate:
            return Response(
                {"error": "You cannot verify yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _, created = UserVerification.objects.get_or_create(
            verifier=request.user,
            candidate=candidate,
        )
        self.activate_user(candidate)
        if created:
            return Response(
                {"detail": "Verification successful."}, status=status.HTTP_201_CREATED
            )
        return Response(
            {"detail": "Verification already done."}, status=status.HTTP_400_BAD_REQUEST
        )
def send_push_notification(receiver_id, title, body, data=None):
    obj = ExpoPushToken.objects.filter(user_id=receiver_id).first()
    if obj:
        # token = obj.token.split('[')[1][:-1]
        token = obj.token
        message = {"to": token,"sound": "default",'title':title,'body': body,'data':data}
        response = requests.post("https://exp.host/--/api/v2/push/send",json=message,
            headers={"Accept": "application/json","Content-Type": "application/json",})
        print(response.json())

class SendPushNotificationView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        sulaiman = 3      
        send_push_notification(receiver_id=sulaiman,title="New Message",body="Hi Sulaiman, You have a new chat message",data={"chat_id": 123})
        return Response({})