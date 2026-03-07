#!/bin/bash

# https://github.com/bobbyiliev/introduction-to-bash-scripting
rm mysite/media/db.sqlite3
python manage.py migrate
python manage.py loaddata datas
python manage.py loaddata offerings
python manage.py loaddata users

# to run $ `bash run.sh`
