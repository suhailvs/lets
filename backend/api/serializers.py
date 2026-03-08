import re
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions
from coinapp.models import Exchange, Listing, Transaction
from .fields import HyperlinkedSorlImageField

User = get_user_model()

def generate_username(exchange_code):
    latest_user = User.objects.filter(username__startswith=exchange_code).order_by('-username').first()
    number = 1
    if latest_user:        
        match = re.search(r'(\d+)$', latest_user.username) # Extract the numeric part
        if match: number = int(match.group(1)) + 1
    return f'{exchange_code}{number:03}' # 3-digit number with leading zeros

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name","last_login", "username","email","is_active", "balance",
            'phone','exchange', "image",'thumbnail']
        read_only_fields = fields
    thumbnail = HyperlinkedSorlImageField(
        '128x128',
        options={"crop": "center"},
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

        if not exchange_selected:
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
            validated_data['username'] = generate_username(exchange.code)
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
    exchange = serializers.ReadOnlyField(source="user.exchange.code")
    class Meta:
        model = Listing
        fields = ("id", "category", "title", "image",'rate','thumbnail','exchange')
    # https://github.com/dessibelle/sorl-thumbnail-serializer-field/tree/master#example-usage
    thumbnail = HyperlinkedSorlImageField(
        '128x128',
        options={"crop": "center"},
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
