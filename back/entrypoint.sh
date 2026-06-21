#!/bin/bash

set -e

echo "Esperando a PostgreSQL..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
    sleep 1
done
echo "PostgreSQL está listo."

echo "Ejecutando migraciones..."
python manage.py migrate --noinput

echo "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "Iniciando servidor ASGI con Daphne..."
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application