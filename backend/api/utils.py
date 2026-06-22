from django.db.models import BooleanField, Case, Q, When
from coinapp.models import Transaction,User, Listing, Exchange

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

def get_transaction_queryset(user,auth_user=None):
    if auth_user:
        qs = Transaction.objects.filter(Q(seller=user,buyer=auth_user) | Q(seller=auth_user,buyer=user))
    else:
        qs = Transaction.objects.filter(Q(seller=user) | Q(buyer=user)) #  show == 'all'
    return (
        qs.select_related("seller", "buyer")
        .annotate(
            is_received=Case(
                When(Q(seller=user), then=True),
                default=False,
                output_field=BooleanField(),
            )
        )
        .order_by("-created_at")
    )


def export_exchange(exchange):
    import tempfile
    import zipfile
    from pathlib import Path 
    from django.conf import settings
    from django.core import serializers as django_serializers
    from django.db.models import Q

    from django.http import HttpResponse
    with tempfile.TemporaryDirectory() as tmpdir:
        users_qs = User.objects.filter(exchange=exchange).order_by("id")
        listings_qs = Listing.objects.filter(user__exchange=exchange).order_by("id")
        transactions_qs = Transaction.objects.filter(
            Q(seller__exchange=exchange) | Q(buyer__exchange=exchange)
        ).distinct().order_by("id")
        exchange_qs = Exchange.objects.filter(id=exchange.id)
        target_dir = Path(settings.BASE_DIR) / "mysite" / "media" / "exports"
        target_dir.mkdir(parents=True, exist_ok=True)
        # Reuse a stable filename so previous export is overwritten.
        archive_path = target_dir / f"exchange_{exchange.code}.zip"

        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            from textwrap import dedent
            text = dedent(f"""\
                Copy the json files to fixtures folder, then load each fixture using command python manage.py loaddata.
                $ ./manage.py loaddata exchange
                $ ./manage.py loaddata users
                $ ./manage.py loaddata listings
                $ ./manage.py loaddata transactions

                users: {users_qs.count()}.
                listings: {listings_qs.count()}.
                transactions: {transactions_qs.count()}.
            """)
            zf.writestr("README.txt",text)
            zf.writestr("exchange.json", django_serializers.serialize("json", exchange_qs, indent=2))
            zf.writestr("users.json", django_serializers.serialize("json", users_qs, indent=2))
            zf.writestr("listings.json", django_serializers.serialize("json", listings_qs, indent=2))
            zf.writestr(
                "transactions.json",
                django_serializers.serialize("json", transactions_qs, indent=2),
            )
        with open(archive_path, "rb") as fh:
            content = fh.read()

    response = HttpResponse(content, content_type="application/zip")
    response["Content-Disposition"] = (
        f'attachment; filename="{exchange.code}_export.zip"'
    )
    return response

