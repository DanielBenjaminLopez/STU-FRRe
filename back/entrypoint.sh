#!/bin/bash

set -e

echo "Esperando a PostgreSQL..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
    sleep 1
done
echo "PostgreSQL está listo."

echo "Ejecutando migraciones..."
python manage.py migrate --noinput

echo "Iniciando servidor de desarrollo..."
exec python manage.py runserver 0.0.0.0:8000
