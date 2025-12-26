


from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from stellar_sdk import Asset, Keypair, Network, Server,CreateAccount, TransactionBuilder

from django.db.models import BooleanField, Case, F, Q, When
from django.db import transaction
from django.conf import settings

from coinapp.models import Transaction

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
class StellarPayment:
    """
        1. Issuer Account (mints tokens)
            + Creates the LETS asset (e.g., LETS:GBLAHISSUER...)
            + Can mint unlimited new LETS
            + Cannot hold its own asset
        
        2. Treasury / Distributor Account
            + Holds the initial supply
            + Distributes tokens to users
            + Burns tokens (by sending back to issuer)
        
        3. User Accounts
            + Hold LETS tokens
            + Cannot mint tokens
    """
    def __init__(self,asset_code):
        self.server = Server(horizon_url="https://horizon-testnet.stellar.org")
        self.network = Network.TESTNET_NETWORK_PASSPHRASE
        # Issuer Public Key: GDCYSZRDZSE36QYPZVXHS4YRHMYMQZX6I5VI5Y74AUCP33GXO7TA5XV5
        self.issuer = Keypair.from_secret(settings.STELLAR_ISSUER_SECRET) 
        # Distributor Public Key: GCCS53AZW7L3KYPDST2A4HLRTVPSFQUTYJMD4IGY4H7WLVFLIXJ4SLFO
        self.distributor = Keypair.from_secret(settings.STELLAR_DISTRIBUTOR_SECRET)  
        self.asset = Asset(asset_code, self.issuer.public_key)

    def _get_txn_builder(self, source_public_key):
        source_account = self.server.load_account(source_public_key)
        return TransactionBuilder(source_account=source_account,network_passphrase=self.network,base_fee=100)

    def _submit_txn(self,txn,source_keypair):    
        txn.sign(source_keypair)    
        return self.server.submit_transaction(txn)

    def create_ac(self,destination_keypair):        
        source_keypair = self.issuer
        ac_txn = self._get_txn_builder(source_keypair.public_key)
        txn = ac_txn.append_operation(CreateAccount(destination=destination_keypair.public_key,
            starting_balance="10",)).set_timeout(100).build()
        txn_resp = self._submit_txn(txn,source_keypair)

    def change_trust(self,source_keypair,limit="1000000"):
        trust_txn = self._get_txn_builder(source_keypair.public_key)
        txn = trust_txn.append_change_trust_op(asset=self.asset).set_timeout(100).build()
        trust_txn_resp = self._submit_txn(txn,source_keypair)
    
    def payment(self,destination_public, amount,distributor_funding=False):
        if distributor_funding:
            # if funding the distributor
            source_keypair = self.issuer
        else:
            source_keypair = self.distributor
        payment_txn = self._get_txn_builder(source_keypair.public_key)
        txn = payment_txn.append_payment_op(destination=destination_public,asset=self.asset,amount=amount).set_timeout(100).build()
        payment_txn_resp = self._submit_txn(txn,source_keypair)

    def fund_distributor(self):
        self.change_trust(self.distributor)
        self.payment(self.distributor.public_key,1_00_000,distributor_funding=True)

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



