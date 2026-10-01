# Guía de Instalación y Ejecución Local (Sin Docker)

Esta guía describe los pasos necesarios para instalar y ejecutar el proyecto **STU-FRRe** directamente sobre el sistema operativo anfitrión (Windows, Linux o macOS) sin utilizar contenedores Docker.

> [!NOTE]
> La modalidad recomendada para desarrollo y evaluación es mediante **Docker Compose** (ver instrucciones en el `README.md` principal), ya que aprovisiona automáticamente PostgreSQL, Redis, dependencias nativas y variables de entorno.

---

## 1. Requisitos Previos

Asegurarse de tener instalados en el sistema:
- **Python 3.12** (`python --version`)
- **Node.js 22** y npm (`node --version`)
- **PostgreSQL 16** (`psql --version`)
- **Redis** (opcional, para canales WebSockets persistentes)
- Dependencias de sistema para extracción y OCR: `tesseract-ocr` y `poppler-utils` (en Linux: `sudo apt install tesseract-ocr poppler-utils`).

---

## 2. Base de Datos PostgreSQL

Crear en PostgreSQL una base de datos y un usuario dedicados:

```sql
CREATE USER totem_user WITH PASSWORD 'cambiar_esta_contraseña';
CREATE DATABASE totem_db OWNER totem_user;
```

---

## 3. Configuración y Ejecución del Backend (Django + ASGI)

1. Ingresar a la carpeta del backend y crear el entorno virtual:
   ```bash
   cd back
   python3.12 -m venv .venv
   source .venv/bin/activate       # En Windows: .venv\Scripts\activate
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Editar `back/.env` completando:
   - `DB_HOST=localhost`
   - `DB_PORT=5432`
   - `DB_NAME=totem_db`
   - `DB_USER=totem_user`
   - `DB_PASSWORD=cambiar_esta_contraseña`
   - `SECRET_KEY=clave-secreta-aleatoria`
   - `DEBUG=True`

3. Ejecutar migraciones, recolectar estáticos y crear el superusuario:
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py createsuperuser
   ```

4. Iniciar el servidor Daphne (ASGI):
   ```bash
   daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```

   *(Opcional: Si se desea habilitar Redis localmente, agregar en `back/.env`:)*
   ```dotenv
   CHANNEL_LAYER_BACKEND=channels_redis.core.RedisChannelLayer
   REDIS_URL=redis://localhost:6379/0
   ```

---

## 4. Configuración y Ejecución del Frontend (React + Vite)

1. En una nueva terminal, ingresar a la carpeta `front`:
   ```bash
   cd front
   npm ci
   npm run dev
   ```

2. **Resolución de Host para el Proxy de Vite:**
   El archivo `vite.config.ts` está configurado por defecto para Docker apuntando a `http://backend:8000`.  
   Para que resuelva correctamente en ejecución local fuera de Docker, agregar un mapeo en el archivo `hosts` de tu sistema operativo (`C:\Windows\System32\drivers\etc\hosts` en Windows o `/etc/hosts` en Linux/macOS):
   ```text
   127.0.0.1 backend
   ```

3. Abrir en el navegador: `http://localhost:5173`.

---

## 5. Acceso a los Servicios

| Servicio | URL |
| :--- | :--- |
| **Frontend (Tótem y Panel)** | http://localhost:5173 |
| **API REST** | http://localhost:8000/api/ |
| **Django Admin** | http://localhost:8000/admin/ |
