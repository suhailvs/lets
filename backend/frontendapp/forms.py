import pycountry

from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from django import forms
from django.forms.utils import ValidationError
from coinapp.models import Exchange, Listing
from api.serializers import generate_username
User = get_user_model()


class SignUpForm(UserCreationForm):
    first_name = forms.CharField(required=True)
    email = forms.EmailField(required=True)
    phone = forms.CharField(required=True)
    tandc = forms.BooleanField(label="Terms and Conditions.")

    def save(self, commit=True, exchange_obj=None):
        user = super().save(commit=commit)
        if exchange_obj:
            # new exchange
            user.username = generate_username(exchange_obj)
            user.exchange = exchange_obj
        else:
            user.username = generate_username(user.exchange) 
        user.save()
        return user

    class Meta(UserCreationForm.Meta):
        model = User
        fields = (
            "exchange",
            "phone",
            "first_name",
            "email",
            "password1",
            "password2",
            "tandc",
        )


class SignUpFormWithoutExchange(SignUpForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("exchange")


def get_country_choices():
    countries = [(c.alpha_2, c.name) for c in pycountry.countries]
    return [('','--select--')]+sorted(countries, key=lambda x: x[1])


def get_state_choices(country_code):
    cities = list(pycountry.subdivisions.get(country_code=country_code))
    return [(city.code, city.name) for city in cities]


class ExchangeForm(forms.ModelForm):
    country_city = forms.ChoiceField(choices=[], label="City")

    def clean_code(self):
        if len(self.cleaned_data["code"]) != 4:
            raise ValidationError(
                "Exchange code must be exactly 4 characters long.", code="invalid_code"
            )
        return self.cleaned_data["code"].upper()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        dummy_country_code = self.data.get("dummy_country_dropdown")
        self.fields["dummy_country_dropdown"] = forms.ChoiceField(
            choices=get_country_choices(), label="Country"
        )
        # need to set city while form reload
        if dummy_country_code:
            self.fields["country_city"].choices = get_state_choices(dummy_country_code)
        self.order_fields(
            ["name", "code", "address", "dummy_country_dropdown", "country_city"]
        )

    class Meta:
        model = Exchange
        fields = ("code", "name", "address", "postal_code","country_city")


class TransactionForm(forms.Form):
    from_user = forms.ModelChoiceField(queryset=User.objects.all())
    to_user = forms.ModelChoiceField(queryset=User.objects.all())
    description = forms.CharField(required=False)
    amount = forms.IntegerField()

    def __init__(self, *args, **kwargs):
        self.request_user = kwargs.pop('request_user', None)
        super().__init__(*args, **kwargs)
        if self.request_user:
            qs = User.objects.filter(exchange=self.request_user.exchange)
            self.fields['from_user'].queryset = qs
            self.fields['to_user'].queryset = qs
        label = lambda u: f"{u.username} | {u.first_name} | bal:{u.balance}"
        self.fields['from_user'].label_from_instance = label
        self.fields['to_user'].label_from_instance = label

    def clean(self):
        cleaned = super().clean()
        from_user = cleaned.get('from_user')
        to_user = cleaned.get('to_user')
        if from_user and to_user and from_user == to_user:
            raise forms.ValidationError("From and To cannot be the same user.")
        return cleaned
    

class DetailWidget(forms.Textarea):
    template_name = "frontendapp/parts/_detail_widget.html"


class ListingForm(forms.ModelForm):
    class Meta:
        model = Listing
        fields = ("category", "title", "description", "rate", "image")
        widgets = {
            "detail": DetailWidget(),  # attrs={'rows': 40}),
        }
        error_messages = {
            "detail": {
                "required": "Please click the above button(Generate Detail from Heading) to fill the Detail using AI.",
            },
        }
