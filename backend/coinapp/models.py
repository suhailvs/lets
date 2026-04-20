import pycountry
from django.contrib.auth.models import AbstractUser
from django.db import models
from . import misc

class User(AbstractUser):
    email = models.EmailField(unique=True)
    exchange = models.ForeignKey("Exchange", on_delete=models.CASCADE, null=True, related_name="users")
    phone = models.CharField(max_length=50, blank=False)
    balance = models.IntegerField(default=0)
    image = models.ImageField(upload_to='users/')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=10.599750)
    longitude = models.DecimalField(max_digits=9, decimal_places=6,default=76.45969)

    @property
    def balance_from_txns(self):
        credited = Transaction.objects.filter(seller=self).aggregate(t=models.Sum('amount'))['t'] or 0
        debited = Transaction.objects.filter(buyer=self).aggregate(t=models.Sum('amount'))['t'] or 0
        return credited - debited


class Exchange(models.Model):
    code = models.CharField(max_length=5, unique=True)
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    country_city = models.CharField(max_length=6)
    postal_code = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.id}: {self.code}({self.name})"

    def get_country_and_subdivision(self):
        try:
            subdivision = pycountry.subdivisions.get(code=self.country_city)
            if subdivision:
                country = pycountry.countries.get(alpha_2=subdivision.country_code)
                return f'{subdivision.name},{country.name}'
            else:
                # countries like antartica, have no subdivision
                return pycountry.countries.get(alpha_2=self.country_city).name
        except Exception as e:
            print(f"Error: {e}")
        return self.country_city


class Listing(models.Model):
    CATEGORY_CHOICES = misc.CATEGORIES
    LISTING_CHOICES = [("O", "Offering"), ("W", "Wants"),]
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="listings")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    rate = models.CharField(max_length=100, blank=True)
    listing_type = models.CharField(max_length=1, choices=LISTING_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='listings/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return f"{self.id}: {self.title}({self.description[:30]}...)"


class Transaction(models.Model):
    seller = models.ForeignKey("User", on_delete=models.CASCADE, related_name="txn_seller")
    buyer = models.ForeignKey("User", on_delete=models.CASCADE, related_name="txn_buyer")
    initiator = models.ForeignKey("User", on_delete=models.CASCADE, related_name="txn_initiator")
    description = models.CharField(max_length=255, blank=True)
    amount = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id}: {self.buyer} -> {self.seller}: {self.amount}"

# =============================================
# mischellenious models
# =============================================
class ExpoPushToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)

class GeneralSettings(models.Model):
    key = models.CharField(max_length=50)
    value = models.CharField(max_length=250)

    def __str__(self) -> str:
        return f"{self.id}: {self.key}:{self.value}"
