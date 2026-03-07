# LETS Backend
[![Django CI](https://github.com/suhailvs/pylets/actions/workflows/django.yml/badge.svg)](https://github.com/suhailvs/pylets/actions/workflows/django.yml)
[![Python Version](https://img.shields.io/badge/python-3.12-brightgreen.svg)](https://python.org)
[![Django Version](https://img.shields.io/badge/django-5.1-brightgreen.svg)](https://djangoproject.com)
[![Django Rest Framework Version](https://img.shields.io/badge/django--rest--framework-3.15.2-brightgreen.svg)](https://www.django-rest-framework.org/)

## Run it locally

```bash
$ cp .env.example .env
$ pip install -r requirements.txt
$ python manage.py migrate
$ python manage.py loaddata datas
$ python manage.py loaddata offerings
$ python manage.py loaddata users
$ python manage.py runserver
```

visit: http://localhost:8000/

## Run Tests

Run the following in your terminal:
+ to run unittests: `./manage.py test`
+ to run functional tests: `pytest`
