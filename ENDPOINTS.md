# Endpoints de la API - STU-FRRe

Base URL: `http://localhost:8000/api`

## Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login/` | Obtener token JWT (access + refresh) | No |
| POST | `/api/auth/token/refresh/` | Renovar token de acceso | No |
| GET | `/api/auth/me/` | Obtener usuario autenticado | Sí |

## CRUD (requieren JWT en header `Authorization: Bearer <token>`)

| Modelo | Ruta | Listar | Crear | Detalle | Actualizar | Eliminar |
|--------|------|--------|-------|---------|------------|----------|
| Carrera | `/api/carreras/` | GET | POST | - | - | - |
| | `/api/carreras/{id}/` | - | - | GET | PUT, PATCH | DELETE |
| Materia | `/api/materias/` | GET | POST | - | - | - |
| | `/api/materias/{id}/` | - | - | GET | PUT, PATCH | DELETE |
| CarreraMateria | `/api/carrerasmaterias/` | GET | POST | - | - | - |
| | `/api/carrerasmaterias/{id}/` | - | - | GET | PUT, PATCH | DELETE |
| HorarioCursado | `/api/horarios/` | GET | POST | - | - | - |
| | `/api/horarios/{id}/` | - | - | GET | PUT, PATCH | DELETE |
| MesaExamen | `/api/mesas-examen/` | GET | POST | - | - | - |
| | `/api/mesas-examen/{id}/` | - | - | GET | PUT, PATCH | DELETE |
| ActividadExtra | `/api/eventos/` | GET | POST | - | - | - |
| | `/api/eventos/{id}/` | - | - | GET | PUT, PATCH | DELETE |
| Suspension | `/api/avisos/` | GET | POST | - | - | - |
| | `/api/avisos/{id}/` | - | - | GET | PUT, PATCH | DELETE |
| Noticias | `/api/noticias/` | GET | POST | - | - | - |
| | `/api/noticias/{id}/` | - | - | GET | PUT, PATCH | DELETE |
