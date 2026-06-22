import requests
import pycountry

from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated,BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import CreateAPIView,GenericAPIView
from coinapp.models import Listing,Exchange,ExpoPushToken
from coinapp.misc import CATEGORIES
from . import serializers
from .utils import get_transaction_queryset, UsernameRateThrottle,export_exchange

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
        login_data = request.data.copy()
        username = str(login_data.get("username", "")).strip().upper()
        login_data["username"] = username

        inactive_user = User.objects.filter(
            username=username, is_active=False
        ).first()
        if inactive_user:
            if inactive_user and inactive_user.check_password(login_data.get("password")):
                return Response(
                    {"is_active": False, "message": "Verification is pending."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = self.serializer_class(
            data=login_data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)
        user_data = serializers.UserSerializer(user, context={"request": request}).data
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
                "thumbnail": user_data.get("thumbnail"),
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
                (e.id, f"{e.code}:{e.name}, {e.get_country_and_subdivision()}, {e.postal_code}")
                for e in Exchange.objects.all()
            ]
        elif purpose == "countries":
            countries = [(c.alpha_2, c.name) for c in pycountry.countries]
            resp["data"] = sorted(countries, key=lambda x: x[1])
        elif purpose == "states":
            country_code = request.GET.get("country")
            if not country_code:
                return Response({"status": "error"}, status=status.HTTP_400_BAD_REQUEST)
            states = list(pycountry.subdivisions.get(country_code=country_code))
            if states:
                resp["data"] = [(s.code, s.name) for s in states]
            else:
                # countries like antartica, have no states
                resp["data"] = [(country_code,pycountry.countries.get(alpha_2=country_code).name)]
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

class ChangePasswordView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.ChangePasswordSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password changed successfully"})

class ExchangeUsersLocationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        qs = User.objects.filter(exchange=request.user.exchange).order_by("first_name", "username")
        serializer = serializers.ExchangeUserLocationSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)
    
class UserReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.UserSerializer
    pagination_class = None
    def get_queryset(self):
        qs = User.objects.filter(exchange=self.request.user.exchange).order_by("first_name")
        if self.action == "list":
            qs = qs.exclude(id = self.request.user.id)
        return qs

class ListingModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        request = self.request
        user = self.request.user
        qs = Listing.objects.filter(user__exchange=user.exchange)
        if self.action == "list":
            listing_type = request.query_params.get("type", "O")
            qs = qs.filter(listing_type=listing_type)
            user_id = request.query_params.get("user",'all')
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
        user_id = request.query_params.get("user")
        if not user_id:
            return Response({"detail": "Missing 'user' query param."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(id=user_id, exchange=request.user.exchange).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

        other_user = request.user if request.query_params.get("show", "all") == "mine" else None
        qs = get_transaction_queryset(user, other_user)

        # Backwards compatible:
        # - No `page`/`page_size` param -> return a plain list (old behavior)
        # - With pagination params -> return DRF paginated shape
        # wants_pagination = any(k in request.query_params for k in ("page", "page_size"))
        # if not wants_pagination:
        #     serializer = serializers.TransactionSerializer(qs, many=True)
        #     return Response(serializer.data)

        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginator.page_size_query_param = "page_size"
        paginator.max_page_size = 200
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = serializers.TransactionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        create_serializer = serializers.TransactionCreateSerializer(data=request.data,context={"request": request})
        if create_serializer.is_valid():
            txn_obj = create_serializer.save()            
            serializer = serializers.TransactionSerializer(txn_obj)
            notification_user = serializer.data['buyer']
            txn_from = serializer.data['seller_name']
            if txn_obj.initiator == txn_obj.buyer:
                notification_user = serializer.data['seller']
                txn_from = serializer.data['buyer_name']
            send_push_notification(receiver_id=notification_user,title="New Transaction",
                body=f"New trasaction from {txn_from}",data={"txn_id": serializer.data['id']})
            return Response(serializer.data)
            
        return Response(create_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
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

class ExportExchangeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return export_exchange(request.user.exchange)
        

def send_push_notification(receiver_id, title, body, data=None):
    obj = ExpoPushToken.objects.filter(user_id=receiver_id).first()
    if obj:
        token = obj.token
        message = {"to": token,"sound": "default",'title':title,'body': body,'data':data}
        response = requests.post("https://exp.host/--/api/v2/push/send",json=message,
            headers={"Accept": "application/json","Content-Type": "application/json",})
        print(response.json())
