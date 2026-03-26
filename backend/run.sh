#!/bin/bash

# https://github.com/bobbyiliev/introduction-to-bash-scripting
rm mysite/media/db.sqlite3
python manage.py migrate
python manage.py loadletsfixtures
# python manage.py loaddata pixl
# python manage.py loaddata kkde

# to run $ `bash run.sh`
