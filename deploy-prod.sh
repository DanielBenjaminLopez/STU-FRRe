#!/bin/bash
set -e

if [ ! -f .env ]; then
  echo "Falta .env. Copia .env.prod.example a .env y editalo."
  exit 1
fi

echo "Levantando en producción..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "Desplegado. Estado:"
docker compose -f docker-compose.prod.yml ps
