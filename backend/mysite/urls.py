
from django.urls import path, include
from django.conf import settings

urlpatterns = [    
    path("api/v1/", include("api.urls")),
    # accounts/ login/ [name='login']
    # accounts/ logout/ [name='logout']
    # accounts/ password_change/ [name='password_change']
    # accounts/ password_change/done/ [name='password_change_done']
    # accounts/ password_reset/ [name='password_reset']
    # accounts/ password_reset/done/ [name='password_reset_done']
    # accounts/ reset/<uidb64>/<token>/ [name='password_reset_confirm']
    # accounts/ reset/done/ [name='password_reset_complete'] 
    path("accounts/", include("django.contrib.auth.urls")),  
]

if True: #settings.DEBUG
    from django.contrib import admin
    from django.conf.urls.static import static
    from frontendapp.views import SignUpJoinView, SignUpNewView
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    urlpatterns += [
        path("", include("frontendapp.urls")),
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/docs/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
        path("admin/", admin.site.urls),        
        path("accounts/signup_join/", SignUpJoinView.as_view(), name="signup_join"),
        path("accounts/signup_new/", SignUpNewView.as_view(), name="signup_new"),
    ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
