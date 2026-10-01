# Arquitectura y Configuración del Sistema STU-FRRe

Este documento describe la arquitectura de software, la infraestructura de servicios, los flujos de comunicación en tiempo real y la configuración de entornos del sistema **STU-FRRe** (Sistema de Tótems Interactivos - UTN Facultad Regional Resistencia).

---

## 1. Visión General del Stack Tecnológico

El sistema adopta una arquitectura desacoplada orientada a alta disponibilidad e interacción táctil en modo kiosco:
<p align="center">
  <img src="img/arquitectura.png" alt="Arquitectura del Sistema" width="400" />
</p>

- **Frontend:** Single Page Application (SPA) construida con **React 18**, **TypeScript**, **Tailwind CSS** y empaquetada con **Vite**. Incluye layout adaptable para tótems verticales/horizontales y panel de gestión administrativa.
- **Backend:** **Django 5** con **Django REST Framework (DRF)**. Se ejecuta como aplicación asíncrona mediante el servidor ASGI **Daphne**.
- **Tiempo Real:** **Django Channels** conectado a **Redis** mediante `channels_redis`, permitiendo notificaciones push instantáneas a las pantallas.
- **Base de Datos:** **PostgreSQL 16** con persistencia en volumen dedicado.
- **Orquestación:** **Docker Compose** para despliegues reproducibles en desarrollo y producción.

---

## 2. Configuración de Entornos y Despliegue

### 3.1. Variables de Entorno (`.env`)
El archivo `.env` en la raíz del proyecto unifica la parametrización de contenedores y servicios:

```ini
# Base de Datos PostgreSQL
DB_NAME=totem_db
DB_USER=postgres
DB_PASSWORD=clave_segura_de_produccion
DB_HOST=db
DB_PORT=5432

# Backend Django
SECRET_KEY=django-insecure-generar-clave-aleatoria-unica
DEBUG=False
PYTHONDONTWRITEBYTECODE=1

# URL de la API consumida por el Frontend
VITE_API_URL=http://localhost:8000/api
```

### 3.2. Configuración en `back/.env` (Ejecución local sin Docker)
Cuando se ejecuta el backend directamente en el sistema operativo anfitrión:
- Cambiar `DB_HOST=localhost`.
- Configurar el broker de Channels en `back/.env`:
  ```ini
  CHANNEL_LAYER_BACKEND=channels_redis.core.RedisChannelLayer
  REDIS_URL=redis://localhost:6379/0
  ```
  *(Si no se dispone de Redis localmente en desarrollo, Django Channels utilizará la memoria del proceso `channels.layers.InMemoryChannelLayer`, aunque no es recomendable para múltiples workers).*

---

## 3. Servicios Docker Compose

El archivo `docker-compose.yml` orquesta 4 servicios interconectados:

| Servicio | Imagen / Build | Puerto Anfitrión | Propósito | Dependencias |
| :--- | :--- | :--- | :--- | :--- |
| `db` | `postgres:16-alpine` | `5432` | Motor relacional con datos persistidos en volumen `postgres_data`. | Ninguna |
| `redis` | `redis:7-alpine` | `6379` (interno) | Broker de mensajería para grupos de WebSockets. | Ninguna |
| `backend` | `./back` (Dockerfile) | `8000` | Servidor ASGI Daphne corriendo la app Django. | `db` (healthy), `redis` (healthy) |
| `frontend` | `./front` (Dockerfile)| `5173` | Servidor de desarrollo Vite con proxy reverso. | `backend` |

### Entrypoint y Ciclo de Inicio del Backend (`entrypoint.sh`)
Al levantar el contenedor `backend`, el script de entrada ejecuta automáticamente las siguientes tareas de mantenimiento antes de abrir el puerto:
1. **Espera activa de PostgreSQL**: Comprueba la disponibilidad de conexión en el host y puerto especificados.
2. **Migraciones:** Ejecuta `python manage.py migrate --noinput` para asegurar el esquema de tablas.
3. **Archivos Estáticos:** Ejecuta `python manage.py collectstatic --noinput`.
4. **Lanzamiento de Daphne:** Inicia el servidor ASGI con `daphne -b 0.0.0.0 -p 8000 config.asgi:application`.

---

## 4. Proxy de Vite en el Frontend

Para simplificar el consumo de la API, WebSocket y archivos multimedia durante el desarrollo y evitar problemas de CORS, `vite.config.ts` incluye las siguientes directivas de reescritura de peticiones:

- `/api` -> `http://backend:8000/api`
- `/media` -> `http://backend:8000/media`
- `/ws` -> `ws://backend:8000/ws` (con soporte para WebSocket upgrade)
