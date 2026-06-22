from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=lambda v: [s.strip() for s in v.split(",")])

ALLOWED_HOSTS = ['*']
# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # apps
    "corsheaders",
    'rest_framework',
    'rest_framework.authtoken',
    "crispy_forms",
    "crispy_bootstrap5",
    'drf_spectacular',
    'sorl.thumbnail',

    # my apps
    "coinapp",
    "api",

    # to remove
    "frontendapp",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "frontendapp.middleware.SuperuserOnlyMiddleware",
]

ROOT_URLCONF = "mysite.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "mysite.wsgi.application"

STATIC_ROOT = BASE_DIR / "mysite" / "static"
MEDIA_ROOT = BASE_DIR / "mysite" / "media"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": MEDIA_ROOT / "db.sqlite3",
    }
}
if config("DB_NAME"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME"),
            "USER": config("DB_USER"),
            "PASSWORD": config("DB_PASSWORD"),
            "HOST": config("DB_HOST"),
            "PORT": "5432",
        }
    }

# AUTH_PASSWORD_VALIDATORS = [
#     {
#         "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
#     },
#     {
#         "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
#     },
#     {
#         "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
#     },
#     {
#         "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
#     },
# ]


LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"  #'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"


MEDIA_URL = '/media/'
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "coinapp.User"
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"
LOGIN_REDIRECT_URL = "frontendapp:exchange_list"
LOGOUT_REDIRECT_URL = "frontendapp:exchange_list"

MAXIMUM_BALANCE = 1000
MINIMUM_BALANCE = -1000
EXCHANGE_USER_LIMIT = 1000
DAILY_TRANSACTION_LIMIT = 10
# GITHUB_TOKEN = config("GITHUB_TOKEN")

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # 'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'login': '5/min',  # Apply to our custom throttle
    }
}
if not DEBUG:
    # in production, on django error return json
    REST_FRAMEWORK["EXCEPTION_HANDLER"] = "api.utils.custom_exception_handler"
SITE_ID = 1 
CORS_ORIGIN_ALLOW_ALL = True
THUMBNAIL_KVSTORE = 'sorl.thumbnail.kvstores.dbm_kvstore.KVStore' # https://sorl-thumbnail.readthedocs.io/en/latest/reference/settings.html?highlight=kvstores#dbm

DEFAULT_FROM_EMAIL = 'noreplay@stackschools.com'
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = 'smtp-relay.brevo.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = '7ba7e9001@smtp-brevo.com'
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD") # see https://app.brevo.com/settings/keys/smtp