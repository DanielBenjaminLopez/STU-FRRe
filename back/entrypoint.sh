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

# Scraping diario de noticias a las 03:00 UTC (00:00 Argentina).
# Corre en background: hereda el env de este script, asi que no hace falta
# volcar variables a un archivo, y su stdout queda en docker compose logs
# backend. Recalcula el objetivo desde el reloj en cada vuelta, asi que no
# deriva y un reinicio del container no pierde el dia.
(
  while true; do
    objetivo=$(date -u -d 'today 03:00' +%s)
    [ "$objetivo" -le "$(date +%s)" ] && objetivo=$(date -u -d 'tomorrow 03:00' +%s)
    sleep $((objetivo - $(date +%s)))
    python manage.py scrape_noticias --sin-contenido ||
      echo "scraping diario falló; se reintenta mañana"
  done
) &

echo "Iniciando servidor ASGI con Daphne..."
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
