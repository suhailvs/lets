from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Listing, GeneralSettings, Transaction, User, Exchange

# https://stackoverflow.com/a/60084208/2351696
extrafields = ('image','exchange','phone','balance')
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (('Other fields',{'fields':extrafields}),)
    list_display = UserAdmin.list_display +  ('phone','balance','balance_from_txns')# + extrafields 
    list_filter = ("is_active","exchange")


class ListingAdmin(admin.ModelAdmin):
    list_filter = ('is_active',)
                   
admin.site.register(GeneralSettings)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Exchange)
admin.site.register(Listing,ListingAdmin)
admin.site.register(Transaction)
