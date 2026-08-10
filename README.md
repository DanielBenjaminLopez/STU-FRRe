# STU-FRRe

Sistema de Tótems Universitarios para la Facultad Resistencia Regional - Práctica supervisada de alumnos de la Universidad Tecnológica Nacional

# Inicio del Proyecto

La problemática que da origen al proyecto surge de la necesidad de modernizar y centralizar la comunicación en un entorno frecuente dentro de la facultad, buscando reducir la falta de información y de orientación para mantener informada tanto a la comunidad universitaria como a los interesados externos que se acercan a la institución.

## Principales problemas detectados

### Orientación

Cuando un alumno es ingresante es muy común que no esté orientado dentro del nuevo ambiente universitario, al igual que cual visitante que se acerca por primera vez a la institución. Estos presentan ciudad confusión al momento de localizar aulas, departamentos y oficinas administrativas de la universidad.

### Comunicación

Los carteles o folletos impresos no permiten la actualización inmediata de información relevante, como alertas de paros docentes, cambios en el calendario académico o noticias urgentes.

### Datos académicos

La consulta de horarios de cursada y fiestas de mesas de exámenes dependen de listas impresiones o archivos PDF.

# Descripción del Proyecto

La solución consiste en un proyecto que conlleva la implementación de un **Tótem Universitario** que funciona como punto de información digital, táctica y de alta disponibilidad para facilitar la disponibilidad de la información.

## Funcionalidades principales

Este tema universitario derecerá una interfaz interactiva que permite a la comunidad educativa:

- Acceder a un sistema de guía interactivo para la orientación física dentro de la facultad.
- Consultar información referida a la facultad actualizada en el momento.
- Visualizar la difusión de diferencias nuevas, noticias y actividades de la institución.
- Acceder a datos académicos específicos (horarios, mesas de examen) por carrera y materia.

# Modalidad de Ejecución

El sistema operará dentro de un navegador web, el cual está configurado en **Modo Kiosco**.
Esta configuración tiene como objetivo restringir o bloquear el acceso directo al sistema operativo.

La aplicación a desarrollar tender la orientación arquitectura de software:
<img ancho="556" alta="733" alt="imagen" src="https://github.com/user-attachments/assets/cf278fd8-d70b-4a56-8c16-0c52fb2ae74f" />

# Objetivos principales del proyecto

- Mejorar la experiencia del usuario y la accesibilidad a la información dentro de la facultad mediante la implementación de un sistema de información.
- Optimizar la gestión y difusión de la información académica a viajes de la automatización de las publicaciones a la comunidad.
- Garantizar la operatividad y confiabilidad del sistema aseguro su estabilidad, disponibilidad y complemento constante.
- Desarrollar una arquitectura que permite la administración remota y configuraciones personalizadas para múltiples unidades.
- Diseñar una interfaz intuitiva que gestiona la actividad e inactividad de forma eficiente, apta para todo tipo de usuarios.

# Puesta en marcha

El proyecto está compuesto por un frontend React/Vite y un backend Django/ASGI. El backend usa PostgreSQL y puede usar Redis para los canales WebSocket. Los pasos siguientes están pensados para una instalación de desarrollo o demostración.

## Opción A: Docker (recomendada)

### Requisitos

- [Docker](https://docs.docker.com/get-docker/) con Docker Compose incluido (`docker compose version`).
- Puertos `5173`, `8000` y `5432` disponibles.

### Configuración inicial

Desde la raíz del repositorio:

```bash
cp .env.example .env
```

Editar `.env`. Como mínimo, cambiar `DB_PASSWORD` y `SECRET_KEY`; `DB_HOST=db` debe conservarse cuando se ejecuta con Compose. `DEBUG=True` es apropiado para desarrollo, pero no para producción.

Variables disponibles:

| Variable                  | Uso                                  | Valor de ejemplo            |
| ------------------------- | ------------------------------------ | --------------------------- |
| `DB_NAME`                 | Base PostgreSQL                      | `totem_db`                  |
| `DB_USER`                 | Usuario PostgreSQL                   | `postgres`                  |
| `DB_PASSWORD`             | Contraseña PostgreSQL                | una contraseña propia       |
| `DB_HOST`                 | Host de PostgreSQL dentro de Compose | `db`                        |
| `DB_PORT`                 | Puerto PostgreSQL                    | `5432`                      |
| `SECRET_KEY`              | Clave privada de Django              | una clave aleatoria         |
| `DEBUG`                   | Modo desarrollo                      | `True`                      |
| `PYTHONDONTWRITEBYTECODE` | Evita archivos `.pyc`                | `1`                         |
| `VITE_API_URL`            | URL informativa de la API            | `http://localhost:8000/api` |

### Arranque y primer usuario

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

El contenedor `backend` espera a PostgreSQL, ejecuta las migraciones y recolecta los archivos estáticos antes de iniciar Daphne. Cuando los servicios estén `running`, crear el usuario administrador:

```bash
docker compose exec backend python manage.py createsuperuser
```

Seguir las preguntas de Django para definir usuario, correo y contraseña. Este paso debe repetirse únicamente si se necesita otro usuario administrador. Los datos quedan en el volumen `postgres_data`.

Para detener y volver a iniciar sin perder datos:

```bash
docker compose down
docker compose up -d
```

`docker compose down -v` elimina también la base de datos y todos sus usuarios y registros; usarlo solo para reiniciar completamente el entorno.

## Opción B: ejecución sin Docker

Esta modalidad requiere instalar localmente Python 3.12, Node.js 22, PostgreSQL 16 y, opcionalmente, Redis. También se necesitan `tesseract-ocr` y `poppler-utils` para las funciones de lectura de archivos del backend.

### 1. Crear la base de datos

Crear en PostgreSQL una base y un usuario que coincidan con los valores que se usarán en `back/.env`, por ejemplo:

```sql
CREATE USER totem_user WITH PASSWORD 'cambiar_esta_contraseña';
CREATE DATABASE totem_db OWNER totem_user;
```

### 2. Configurar y arrancar el backend

```bash
cd back
python3.12 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

Editar `back/.env` y completar `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST=localhost` y `DB_PORT=5432`. Mantener `DEBUG=True` para desarrollo. Luego:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

Si se quiere habilitar Redis y WebSocket en lugar del canal en memoria, instalar Redis, iniciarlo y agregar al `.env`:

```dotenv
CHANNEL_LAYER_BACKEND=channels_redis.core.RedisChannelLayer
REDIS_URL=redis://localhost:6379/0
```

### 3. Configurar y arrancar el frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd front
npm ci
npm run dev
```

El proxy de Vite está configurado para Docker y apunta a `http://backend:8000`. Para usarlo fuera de Docker, agregar temporalmente esta resolución local (Linux/macOS) o mapear `backend` a `127.0.0.1` en el archivo `hosts` del sistema:

```text
127.0.0.1 backend
```

Luego abrir `http://localhost:5173`. Para detener el frontend o backend, usar `Ctrl+C` en sus respectivas terminales.

## Acceso y uso inicial

| Servicio              | URL                          |
| --------------------- | ---------------------------- |
| Frontend              | http://localhost:5173        |
| API                   | http://localhost:8000/api/   |
| Administración Django | http://localhost:8000/admin/ |

1. Entrar a `/admin/` con el superusuario creado.
2. Cargar los datos necesarios desde el panel de administración, como carreras, materias, espacios, horarios, mesas, eventos, avisos y noticias.
3. Usar el frontend para acceder a la vista pública del tótem y a las funciones administrativas disponibles.

Las llamadas del frontend a `/api/*`, `/media/*` y `/ws` se enrutan mediante el proxy de Vite. No se debe abrir `index.html` directamente desde el sistema de archivos.

## Configurar y vincular un tótem

La configuración inicial de un tótem se realiza desde el frontend y el panel de administración. Es necesario crear previamente el superusuario indicado en los pasos anteriores.

1. Abrir la raíz del frontend en `http://localhost:5173/`. Si el dispositivo todavía no está vinculado, se mostrará un código de emparejamiento.
2. Ingresar al panel de administración desde la sección administrativa del frontend en `http://localhost:5173/admin/`.
3. Ir a registrar un nuevo tótem e introducir el código de emparejamiento mostrado en la pantalla del dispositivo.
4. Confirmar la operación y comprobar que el tótem figure como vinculado. El código es temporal y debe utilizarse mientras se muestra en el dispositivo.
5. Crear una plantilla desde la sección de plantillas. Seleccionar los widgets que se desean mostrar y definir su distribución o configuración correspondiente.
6. Asociar la plantilla creada al tótem vinculado. A partir de ese momento, el tótem utilizará esa plantilla para construir su pantalla.
7. Completar el contenido de cada widget desde su sección correspondiente del panel: noticias, calendario y eventos, avisos, horarios, mesas de examen, carreras, materias, espacios u otros datos disponibles.
8. Volver a la pantalla del tótem y verificar que los widgets muestren la información cargada. Los cambios de contenido se reflejan en el dispositivo al actualizarse la información o mediante la conexión en tiempo real cuando corresponda.

El orden recomendado es **vincular el tótem, crear y asignar una plantilla, y finalmente cargar el contenido**. Crear contenido antes de configurar la plantilla no hará que aparezca en pantalla si ningún widget lo utiliza.

## Operación y diagnóstico

Con Docker, consultar logs con `docker compose logs -f backend`, `docker compose logs -f frontend` o `docker compose logs -f db`. Si el backend no inicia, comprobar primero que PostgreSQL esté saludable y que las variables de `.env` coincidan con la base. Si se modifica una migración o se incorporan cambios del código, reconstruir con `docker compose up -d --build`.

## Endpoints de la API

Base URL: `http://localhost:8000/api`

### Autenticación

| Método | Ruta                       | Descripción                          | Auth |
| ------ | -------------------------- | ------------------------------------ | ---- |
| POST   | `/api/auth/login/`         | Obtener token JWT (access + refresh) | No   |
| POST   | `/api/auth/token/refresh/` | Renovar token de acceso              | No   |
| GET    | `/api/auth/me/`            | Obtener usuario autenticado          | Sí   |

### CRUD (requieren JWT en header `Authorization: Bearer <token>`)

| Modelo         | Ruta                          | Listar | Crear | Detalle | Actualizar | Eliminar |
| -------------- | ----------------------------- | ------ | ----- | ------- | ---------- | -------- |
| Carrera        | `/api/carreras/`              | GET    | POST  | -       | -          | -        |
|                | `/api/carreras/{id}/`         | -      | -     | GET     | PUT, PATCH | DELETE   |
| Materia        | `/api/materias/`              | GET    | POST  | -       | -          | -        |
|                | `/api/materias/{id}/`         | -      | -     | GET     | PUT, PATCH | DELETE   |
| CarreraMateria | `/api/carrerasmaterias/`      | GET    | POST  | -       | -          | -        |
|                | `/api/carrerasmaterias/{id}/` | -      | -     | GET     | PUT, PATCH | DELETE   |
| HorarioCursado | `/api/horarios/`              | GET    | POST  | -       | -          | -        |
|                | `/api/horarios/{id}/`         | -      | -     | GET     | PUT, PATCH | DELETE   |
| MesaExamen     | `/api/mesas-examen/`          | GET    | POST  | -       | -          | -        |
|                | `/api/mesas-examen/{id}/`     | -      | -     | GET     | PUT, PATCH | DELETE   |
| ActividadExtra | `/api/eventos/`               | GET    | POST  | -       | -          | -        |
|                | `/api/eventos/{id}/`          | -      | -     | GET     | PUT, PATCH | DELETE   |
| Suspension     | `/api/avisos/`                | GET    | POST  | -       | -          | -        |
|                | `/api/avisos/{id}/`           | -      | -     | GET     | PUT, PATCH | DELETE   |
| Noticias       | `/api/noticias/`              | GET    | POST  | -       | -          | -        |
|                | `/api/noticias/{id}/`         | -      | -     | GET     | PUT, PATCH | DELETE   |
