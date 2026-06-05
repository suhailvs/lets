from django.urls import path
from . import views

app_name = "frontendapp"
urlpatterns = [
    path("", views.ExchangeView.as_view(), name="exchange_list"),
    path("<str:exchange>/transaction/", views.transaction_view, name="transaction_list"), # HomeView.as_view()
    path("<str:exchange>/user/", views.UserList.as_view(), name="user_list"),
    path("<str:exchange>/listing/", views.ListingView.as_view(), name="listing_list"),      
    path("<str:exchange>/<int:user>/",views.UserDetail.as_view(),name="user_detail"),
    path("transaction/<int:txn_id>/delete/", views.delete_transaction, name="delete_transaction"),
    
    path('listing/<int:pk>/delete/', views.ListingDeleteView.as_view(), name='listing_delete'),
    path('listing/<int:pk>/preview/', views.ListingPreviewView.as_view(), name='listing_preview'),
    path("ajax/<str:purpose>/", views.ajax_views, name="ajax_views"), # see https://github.com/gamifications/shihas_bill
    
    path("backup-media/", views.backup_media, name="backup_media"),
]
