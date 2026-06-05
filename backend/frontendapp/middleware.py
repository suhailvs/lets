# middleware.py
from django.shortcuts import redirect
class SuperuserOnlyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/frontendapp/'):
            if not request.user.is_authenticated or not request.user.is_superuser:
                return redirect("/accounts/login/")
        return self.get_response(request)