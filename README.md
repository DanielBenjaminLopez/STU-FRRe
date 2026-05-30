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

# Inicio rápido con Docker

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/) instalados.

## Configuración de variables de entorno

1. Copiar el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env` según sea necesario. Las variables disponibles son:

   | Variable | Descripción |
   |---|---|
   | `DB_NAME` | Nombre de la base de datos PostgreSQL |
   | `DB_USER` | Usuario de PostgreSQL |
   | `DB_PASSWORD` | Contraseña de PostgreSQL |
   | `DB_HOST` | Host de la base de datos (servicio Docker) |
   | `DB_PORT` | Puerto de PostgreSQL |
   | `SECRET_KEY` | Clave secreta de Django |
   | `DEBUG` | Modo debug de Django |
   | `PYTHONDONTWRITEBYTECODE` | Evita archivos `.pyc` |
   | `VITE_API_URL` | URL base de la API para el frontend |

## Levantar los servicios

```bash
# Construir e iniciar todos los servicios
docker compose up --build

# En segundo plano (detached)
docker compose up -d --build

# Ver logs de un servicio específico
docker compose logs -f backend

# Ejecutar comandos en el backend (ej: crear superusuario)
docker compose exec backend python manage.py createsuperuser

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (borra la base de datos)
docker compose down -v
```

## Acceso a los servicios

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Admin Django | http://localhost:8000/admin/ |

> El frontend utiliza un proxy de Vite: las llamadas a `/api/*` se redirigen automáticamente al backend. No es necesario configurar CORS para desarrollo.
