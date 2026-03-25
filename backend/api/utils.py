from django.db.models import BooleanField, Case, Q, When
from coinapp.models import Transaction

from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

class UsernameRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        username = request.data.get('username')
        if not username:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': username.lower()
        }

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {"error": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    return response

def get_transaction_queryset(user):
    return (
        Transaction.objects.filter(Q(seller=user) | Q(buyer=user))
        .select_related("seller", "buyer")
        .annotate(
            is_received=Case(
                When(Q(seller=user), then=True),
                default=False,
                output_field=BooleanField(),
            )
        )
        .order_by("-created_at")
    )



