import re
from sorl.thumbnail import get_thumbnail # pip install sorl-thumbnail
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions
from django.utils import timezone
from django.db.models import Q,F
from django.conf import settings
from coinapp.models import Exchange, Listing, Transaction

User = get_user_model()

# https://github.com/dessibelle/sorl-thumbnail-serializer-field/blob/master/sorl_thumbnail_serializer/fields.py
class HyperlinkedSorlImageField(serializers.ImageField):
    def __init__(self, geometry="300x300", *args, **kwargs):
        self.geometry = geometry
        super().__init__(*args, **kwargs)

    def to_representation(self, value):
        if not value: return None
        try:
            thumb = get_thumbnail(value, self.geometry, crop="center", quality=90)
        except Exception:
            return None
        request = self.context.get("request")
        if request: return request.build_absolute_uri(thumb.url)
        return thumb.url

def generate_username(exchange):
    existing_usernames = User.objects.filter(
        exchange=exchange
    ).values_list("username", flat=True)
    used_numbers = set()
    for username in existing_usernames:
        match = re.search(r'(\d+)$', username)
        if match: used_numbers.add(int(match.group(1)))

    for i in range(0, 100):
        if i not in used_numbers:
            return f"{exchange.code}{i:02}"
    

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name","last_login", "username","email","is_active", "balance",
            'phone','exchange', "image",'thumbnail']
        read_only_fields = fields
    thumbnail = HyperlinkedSorlImageField(
        '128x128',
        # options={"crop": "center"},
        source='image',
        read_only=True
    )
class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    exchange = serializers.PrimaryKeyRelatedField(
        queryset=Exchange.objects.all(), required=False
    )
    exchange_code = serializers.CharField(write_only=True, required=False)
    exchange_name = serializers.CharField(write_only=True, required=False)
    exchange_address = serializers.CharField(write_only=True, required=False)
    exchange_country_city = serializers.CharField(write_only=True, required=False)
    exchange_postal_code = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    is_active = serializers.BooleanField(read_only=True)
    class Meta:
        model = User
        fields = [
            "first_name",
            'email',
            "phone",
            "password",
            "exchange",
            "exchange_code",
            "exchange_name",
            "exchange_address",
            "exchange_country_city",
            "exchange_postal_code",
            'username',
            "image",
            "is_active",
        ]
        read_only_fields = ['username']

    

    def validate(self, attrs):
        create_exchange_fields = [
            "exchange_code",
            "exchange_name",
            "exchange_address",
            "exchange_country_city",
        ]
        exchange_selected = bool(attrs.get("exchange"))
        create_exchange_requested = any(attrs.get(field) for field in create_exchange_fields)

        if exchange_selected and create_exchange_requested:
            raise serializers.ValidationError(
                {"exchange": "Choose an existing exchange or create a new one, not both."}
            )

        if exchange_selected:
            count = User.objects.filter(exchange_id=exchange_selected).count()

            if count >= 100:
                raise serializers.ValidationError("This exchange already has 100 users")
        else:
            missing = [field for field in create_exchange_fields if not attrs.get(field)]
            if missing:
                raise serializers.ValidationError(
                    {
                        "exchange": (
                            "Either select an existing exchange or provide all new exchange fields."
                        )
                    }
                )
            exchange_code = attrs["exchange_code"].upper()
            if len(exchange_code) != 4:
                raise serializers.ValidationError(
                    {"exchange_code": "Exchange code must be exactly 4 characters long."}
                )
            if Exchange.objects.filter(code=exchange_code).exists():
                raise serializers.ValidationError(
                    {"exchange_code": "Exchange code already exists."}
                )
            attrs["exchange_code"] = exchange_code

        user_data = {
            key: value
            for key, value in attrs.items()
            if key in {"first_name", "email", "phone", "exchange", "image"}
        }
        user = User(**user_data)
        password = attrs.get("password")
        try:
            validate_password(password, user)
        except django_exceptions.ValidationError as e:
            serializer_error = serializers.as_serializer_error(e)
            raise serializers.ValidationError({"password": serializer_error})

        return attrs

    def create(self, validated_data):
        exchange = validated_data.pop("exchange", None)
        exchange_code = validated_data.pop("exchange_code", None)
        exchange_name = validated_data.pop("exchange_name", None)
        exchange_address = validated_data.pop("exchange_address", None)
        exchange_country_city = validated_data.pop("exchange_country_city", None)
        exchange_postal_code = validated_data.pop("exchange_postal_code", "")
        is_active = False
        with transaction.atomic():
            if not exchange:
                exchange = Exchange.objects.create(
                    code=exchange_code,
                    name=exchange_name,
                    address=exchange_address,
                    country_city=exchange_country_city,
                    postal_code=exchange_postal_code,
                )
                is_active = True

            validated_data["exchange"] = exchange
            validated_data['username'] = generate_username(exchange)
            user = User.objects.create_user(**validated_data)
            user.is_active = is_active
            user.save()
        return user


class ListingDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Nest the entire Category object

    class Meta:
        model = Listing
        fields = "__all__"


class ListingListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = ("id", "category", "title", "image","rate",'thumbnail','created_at')
    # https://github.com/dessibelle/sorl-thumbnail-serializer-field/tree/master#example-usage
    thumbnail = HyperlinkedSorlImageField(
        '128x128',
        # options={"crop": "center"},
        source='image',
        read_only=True
    )


class ListingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = (
            "id",
            "category",
            "title",
            "description",
            "rate",
            "listing_type",
            "image",
        )


class TransactionSerializer(serializers.ModelSerializer):
    is_received = serializers.BooleanField(default=False)
    seller_name = serializers.ReadOnlyField(source="seller.first_name")
    buyer_name = serializers.ReadOnlyField(source="buyer.first_name")

    class Meta:
        model = Transaction
        fields = "__all__"

class TransactionCreateSerializer(serializers.Serializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    transaction_type = serializers.ChoiceField(choices=(('seller','seller'),('buyer','buyer')))
    message = serializers.CharField(max_length=255,required=False,allow_blank=True)
    amount = serializers.IntegerField()

    def validate(self, data):
        today = timezone.now().date()
        # default is seller transaction(receive money)
        seller = self.context["request"].user
        buyer = data["user"]
        amt = data["amount"]
        if seller == buyer:
            raise serializers.ValidationError("You cannot transfer funds to your own account.")
        if seller.exchange_id != buyer.exchange_id:
            raise serializers.ValidationError("Oops! You can only send money to members of your own exchange.")
        
        try:
            amt = int(amt)
        except ValueError:
            # if . in amt
            raise serializers.ValidationError("Txn Amount must be Integer.")
        if amt < 1:
            raise serializers.ValidationError("Txn Amount must be greater than 0.")
        
        if data["transaction_type"] == "buyer":
            # send money
            seller, buyer = buyer, seller

        # _check_max_min_balance
        if seller.balance + amt > settings.MAXIMUM_BALANCE:
            raise serializers.ValidationError("Seller has reached the maximum allowed amount")
        if buyer.balance - amt < settings.MINIMUM_BALANCE:
            raise serializers.ValidationError("Insufficient balance to complete the transaction.")
    
        seller_count = Transaction.objects.filter(
            Q(seller=seller) | Q(buyer=seller),
            created_at__date=today
        ).count()

        if seller_count >= 10:
            raise serializers.ValidationError("Seller reached daily limit")

        buyer_count = Transaction.objects.filter(
            Q(seller=buyer) | Q(buyer=buyer),
            created_at__date=today
        ).count()

        if buyer_count >= 10:
            raise serializers.ValidationError("Buyer reached daily limit")

        return data
    
    def create(self, validated_data):
        # default is seller transaction(receive money)
        seller = self.context["request"].user
        buyer = validated_data["user"]
        if validated_data["transaction_type"] == "buyer":
            # send money
            seller, buyer = buyer, seller
        with transaction.atomic():
            seller.balance = F("balance") + validated_data['amount']
            buyer.balance = F("balance") - validated_data['amount']
            seller.save(update_fields=["balance"])
            buyer.save(update_fields=["balance"])
            txn = Transaction.objects.create(
                seller=seller,
                buyer=buyer,
                initiator=self.context["request"].user,
                description=validated_data['message'],
                amount=validated_data['amount'],
            )
        return txn