from django.contrib.auth import get_user_model
from django.views.generic import CreateView, ListView, DeleteView, DetailView
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.utils.decorators import method_decorator
from django.db.models import Q, F
from django.db import transaction
from django.contrib import messages
from django.urls import reverse_lazy, reverse
from django.views.generic.edit import FormView
from django.http import JsonResponse,HttpResponseForbidden
from django.conf import settings

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


def save_transaction(amt, desc, seller, buyer,auth_user):
    resp = lambda s, msg, txn=None: {"success": s, "msg": msg, "txn_obj": txn}
    if not (seller.exchange_id == buyer.exchange_id == auth_user.exchange_id):
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
    success_url = reverse_lazy("frontendapp:home")
    template_name = "registration/signup_join.html"


class SignUpNewView(CreateView):
    form_class = SignUpFormWithoutExchange
    # success_url = reverse_lazy("frontendapp:home")
    template_name = "registration/signup_new.html"

    def form_valid(self, form):
        ctx = self.get_context_data()
        exchange_form = ctx["exchange_form"]
        if exchange_form.is_valid() and form.is_valid():
            with transaction.atomic():
                exchange_obj = exchange_form.save()
                user_obj = form.save(exchange_obj=exchange_obj)
                login(self.request, user_obj)
                return redirect(reverse_lazy("frontendapp:home"))
        else:
            return self.render_to_response(self.get_context_data(form=form))

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        if self.request.POST:
            ctx["exchange_form"] = ExchangeForm(self.request.POST)
        else:
            ctx["exchange_form"] = ExchangeForm()
        return ctx


@login_required
def transaction_view(request):
    if request.method == "POST":
        form = TransactionForm(request.POST, request_user=request.user)
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
            return redirect("frontendapp:home")
    else:
        # Pre-fill from_user with the logged-in user
        form = TransactionForm(
            initial={"from_user": request.user},
            request_user=request.user,
        )

    latest_trans = Transaction.objects.filter(initiator__exchange=request.user.exchange).order_by('-created_at')[:5]
    return render(request,"home.html",{"transaction_form": form, "transactions": latest_trans},)

@login_required
def delete_transaction(request, txn_id):
    txn = Transaction.objects.get(id=txn_id)
    # Only allow initiator to delete
    if txn.initiator != request.user:
        messages.error(request, "You can only delete transactions you initiated.")
        return redirect("frontendapp:home")
    if request.method == "POST":
        # Reverse the balances
        with transaction.atomic():
            txn.seller.balance = F("balance") - txn.amount
            txn.buyer.balance  = F("balance") + txn.amount
            txn.seller.save(update_fields=["balance"])
            txn.buyer.save(update_fields=["balance"])
            txn.delete()
        messages.success(request, "Transaction deleted and balances reversed.")
    return redirect("frontendapp:home")

class ExchangeView(ListView):
    paginate_by = 20
    template_name = "frontendapp/exchanges.html"
    context_object_name = "exchanges"

    def get_queryset(self):
        return Exchange.objects.all()


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

    @method_decorator(login_required)
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

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


@method_decorator([login_required], name="dispatch")
class ListingDeleteView(DeleteView):
    model = Listing

    def get_queryset(self):
        return Listing.objects.filter(user=self.request.user)

    def get_success_url(self):
        u = self.request.user
        return reverse(
            "frontendapp:user_detail",
            kwargs={"exchange": u.exchange.code, "user": u.id},
        )


class ListingPreviewView(DetailView):
    model = Listing
    template_name = "frontendapp/listing_detail.html"
