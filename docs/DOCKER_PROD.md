# Despliegue con Docker en Producción

Este repositorio incluye configuración lista para producción con Docker Compose.

## Pasos para desplegar

1. **Clonar repo en servidor** (con docker + docker compose v2)

2. **Preparar variables de entorno**

```bash
cp .env.prod.example .env
```

Editar `.env` con valores seguros:

- `SECRET_KEY`: generar (ej. `openssl rand -base64 64`)
- `DB_PASSWORD`: contraseña fuerte
- `ALLOWED_HOSTS`: dominio(s) reales
- `FRONTEND_PORT`: 80/443 según proxy externo
- `VITE_API_URL`: https://tu-dominio.com/api (usado en build si aplica)

3. **Levantar stack**

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

4. **Verificar salud**

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## Gestión

- **Detener**: `docker compose -f docker-compose.prod.yml down`
- **Actualizar**: `git pull && docker compose -f docker-compose.prod.yml up -d --build`
- **Backups DB**: `docker compose -f docker-compose.prod.yml exec db pg_dump -U $DB_USER $DB_NAME > backup.sql`
- **Restaurar**: `cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U $DB_USER $DB_NAME`

## Desarrollo vs Producción

- **Desarrollo**: `docker compose up -d --build` usa `.env.local` automáticamente gracias a `docker-compose.override.yml`. Si no existe, copiar `.env` a `.env.local` o `.env.example` a `.env.local`.
- **Producción**: `docker compose -f docker-compose.prod.yml --env-file .env up -d --build` carga variables desde `.env` (no desde `.env.local`).

### Configuración de archivos .env

- **Desarrollo**: copiar `.env.example` → `.env.local`. `docker compose up` usará `.env.local` (via `docker-compose.override.yml`).
- **Producción**: copiar `.env.prod.example` → `.env`. Usar `--env-file .env` con `docker-compose.prod.yml`.
