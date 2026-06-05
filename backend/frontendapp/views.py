from django.contrib.auth import get_user_model
from django.views.generic import CreateView, ListView, DeleteView, DetailView
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.db.models import Q, F
from django.db import transaction
from django.contrib import messages
from django.urls import reverse_lazy, reverse
from django.views.generic.edit import FormView
from django.http import JsonResponse
from django.conf import settings
from django.core.paginator import Paginator
from coinapp.models import Listing, Exchange, Transaction
from frontendapp.forms import (
    SignUpForm,
    SignUpFormWithoutExchange,
    TransactionForm,
    ExchangeForm,
    ListingForm,
    get_state_choices,
)
from api.utils import get_transaction_queryset

User = get_user_model()



def index(request):
    if request.user.is_authenticated:
        return redirect('frontendapp:exchange_list')
    return redirect('/accounts/login/') #admin:index')
    
def save_transaction(amt, desc, seller, buyer,auth_user):
    resp = lambda s, msg, txn=None: {"success": s, "msg": msg, "txn_obj": txn}
    if not (seller.exchange_id == buyer.exchange_id):# == auth_user.exchange_id):
        msg = "Oops! You can only send money to members of your own exchange."
        return resp(False, msg)

    try:
        amt = int(amt)
    except ValueError:
        # if . in amt
        return resp(False, "Txn Amount must be Integer.")
    if amt < 1:
        return resp(False, "Txn Amount must be greater than 0.")
    
    # _check_max_min_balance
    if seller.balance + amt > settings.MAXIMUM_BALANCE:
        return resp(False, "Seller has reached the maximum allowed amount")
    if buyer.balance - amt < settings.MINIMUM_BALANCE:
        return resp(False, "Insufficient balance to complete the transaction.")

    with transaction.atomic():
        seller.balance = F("balance") + amt
        buyer.balance = F("balance") - amt
        seller.save(update_fields=["balance"])
        buyer.save(update_fields=["balance"])
        txn = Transaction.objects.create(
            seller=seller,
            buyer=buyer,
            initiator = auth_user,
            description=desc,
            amount=amt,
        )
        return resp(True, "", txn)
    return resp(False, "Transaction Failed")

def ajax_views(request, purpose):
    resp = ""
    if purpose == "get_cities":
        resp = get_state_choices(request.GET.get("country"))
    return JsonResponse({"data": resp})


class SignUpJoinView(CreateView):
    form_class = SignUpForm
    success_url = reverse_lazy("frontendapp:exchange_list")
    template_name = "registration/signup_join.html"


class SignUpNewView(CreateView):
    form_class = SignUpFormWithoutExchange
    # success_url = reverse_lazy("frontendapp:exchange_list")
    template_name = "registration/signup_new.html"

    def form_valid(self, form):
        ctx = self.get_context_data()
        exchange_form = ctx["exchange_form"]
        if exchange_form.is_valid() and form.is_valid():
            with transaction.atomic():
                exchange_obj = exchange_form.save()
                user_obj = form.save(exchange_obj=exchange_obj)
                login(self.request, user_obj)
                return redirect(reverse_lazy("frontendapp:exchange_list"))
        else:
            return self.render_to_response(self.get_context_data(form=form))

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        if self.request.POST:
            ctx["exchange_form"] = ExchangeForm(self.request.POST)
        else:
            ctx["exchange_form"] = ExchangeForm()
        return ctx


def transaction_view(request,exchange):
    if request.method == "POST":
        form = TransactionForm(request.POST, exchange=exchange)
        if form.is_valid():
            amt    = form.cleaned_data["amount"]
            desc   = form.cleaned_data["description"]
            from_u = form.cleaned_data["from_user"]
            to_u   = form.cleaned_data["to_user"]


            response_data = save_transaction(amt, desc, to_u, from_u,request.user)
            if response_data["success"]:
                txn = response_data["txn_obj"]
                messages.success(request, f"Success! txnId:{txn.id}")
            else:
                messages.error(request, response_data["msg"])
            return redirect("frontendapp:exchange_list")
    else:
        # Pre-fill from_user with the logged-in user
        form = TransactionForm(exchange=exchange)

    txs = Transaction.objects.filter(seller__exchange__code=exchange).order_by('-created_at')
    paginator = Paginator(txs, 5)
    return render(request,"frontendapp/transaction.html",{"transaction_form": form, "page_obj": paginator.get_page(request.GET.get('page',1))},)

def delete_transaction(request, txn_id):
    txn = Transaction.objects.get(id=txn_id)
    # # Only allow initiator to delete
    # if txn.initiator != request.user:
    #     messages.error(request, "You can only delete transactions you initiated.")
    #     return redirect("frontendapp:exchange_list")
    if request.method == "POST":
        # Reverse the balances
        with transaction.atomic():
            txn.seller.balance = F("balance") - txn.amount
            txn.buyer.balance  = F("balance") + txn.amount
            txn.seller.save(update_fields=["balance"])
            txn.buyer.save(update_fields=["balance"])
            txn.delete()
        messages.success(request, "Transaction deleted and balances reversed.")
    return redirect("frontendapp:exchange_list")

class ExchangeView(ListView):
    paginate_by = 20
    template_name = "frontendapp/exchanges.html"
    context_object_name = "exchanges"

    def get_queryset(self):
        return Exchange.objects.order_by('code')


class UserList(ListView):
    paginate_by = 20
    template_name = "frontendapp/user_list.html"
    context_object_name = "users"

    def get_queryset(self):
        query = self.request.GET.get("q", "")
        queryset = User.objects.filter(exchange__code=self.kwargs["exchange"]).order_by(
            "first_name"
        )
        if query:
            queryset = queryset.filter(
                Q(username__icontains=query) | Q(first_name__icontains=query)
            )
        return queryset


class UserDetail(FormView):
    template_name = "frontendapp/user_detail.html"
    form_class = ListingForm

    def get_context_data(self, **kwargs):
        user = User.objects.get(id=self.kwargs["user"])
        ctx = super().get_context_data(**kwargs)
        extra = {
            "current_user": user,
            "transactions": get_transaction_queryset(user),
            "userlistings": Listing.objects.filter(user=user),
        }
        return ctx | extra

    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        obj = form.save(commit=False)
        obj.listing_type = self.request.POST["listing_type"]
        obj.user = self.request.user
        obj.save()
        messages.success(self.request, f"Listing activated: {obj}.")
        return redirect(
            "frontendapp:user_detail",
            exchange=self.kwargs["exchange"],
            user=self.kwargs["user"],
        )


class ListingDeleteView(DeleteView):
    model = Listing

    def get_queryset(self):
        return Listing.objects.all()

    def get_success_url(self):
        return reverse("frontendapp:exchange_list")


class ListingPreviewView(DetailView):
    model = Listing
    template_name = "frontendapp/listing_detail.html"

def backup_media(request):
    import zipfile
    from datetime import datetime
    from django.http import FileResponse
    import os
    
    media_root = settings.MEDIA_ROOT
    backup_dir = os.path.join(settings.BASE_DIR,"mysite", "backups")
    os.makedirs(backup_dir, exist_ok=True)

    # Delete existing zip files in backups folder
    for f in os.listdir(backup_dir):
        if f.endswith(".zip"): os.remove(os.path.join(backup_dir, f))
    timestamp = datetime.now().strftime("%d%m%Y_%H%M%S")
    zip_name  = f"media_backup_{timestamp}.zip"
    zip_path  = os.path.join(backup_dir, zip_name)

    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(media_root):
                for file in files:
                    abs_path = os.path.join(root, file)
                    arc_path = os.path.relpath(abs_path, media_root)
                    zf.write(abs_path, arc_path)

        # Stream the file to browser without loading into RAM
        response = FileResponse(
            open(zip_path, "rb"),
            content_type="application/zip",
            as_attachment=True,
            filename=zip_name,
        )
        return response

    except Exception as e:
        return JsonResponse({"Error":f"Error: {e}"})
