# Catálogo de Endpoints de la API y WebSockets - STU-FRRe

Base URL de la API: `http://localhost:8000/api`  
Base URL de WebSockets: `ws://localhost:8000/ws`

---

## 1. Convenciones de Autenticación y Acceso

| Tipo de Acceso | Encabezado / Parámetro | Descripción |
| :--- | :--- | :--- |
| **Público** | Ninguno | Rutas de solo lectura (GET) consumidas por los tótems sin necesidad de credenciales. |
| **Admin / Secretaría** | `Authorization: Bearer <access_token>` | Token JWT obtenido en `/api/auth/login/`. Requerido para operaciones de escritura (POST, PUT, PATCH, DELETE). |
| **Tótem Vinculado** | `Authorization: Bearer <totem_token>` | Token específico del tótem emitido al vincularlo. Se usa en `/api/totems/me/` y en `?token=...` de WebSocket. |

---

## 2. Módulo de Autenticación

| Método | Endpoint | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login/` | Iniciar sesión con usuario y contraseña; retorna `access` y `refresh` tokens JWT. | No |
| `POST` | `/api/auth/token/refresh/` | Renovar token de acceso enviando el `refresh` token. | No |
| `GET` | `/api/auth/me/` | Obtener datos del usuario autenticado (username, email, roles). | Admin / Secretaría |

---

## 3. Módulo de Tótems y Emparejamiento

| Método | Endpoint | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/totems/new/` | Solicitar código de vinculación de 5 dígitos para un tótem no registrado. | No |
| `POST` | `/api/totems/vincular/` | Enlazar un tótem ingresando su código temporal, nombre y plantilla asignada. | Admin / Secretaría |
| `GET` | `/api/totems/me/` | Consultar la plantilla, widgets y configuración propia del tótem en ejecución. | Tótem Vinculado |
| `GET` | `/api/totems/` | Listar todos los tótems registrados y su estado de vinculación. | Admin / Secretaría |
| `POST` | `/api/totems/` | Registrar un tótem de forma manual. | Admin / Secretaría |
| `GET` | `/api/totems/{id}/` | Ver detalle de un tótem específico. | Admin / Secretaría |
| `PUT, PATCH` | `/api/totems/{id}/` | Actualizar configuración, nombre, espacio o plantilla del tótem. | Admin / Secretaría |
| `DELETE` | `/api/totems/{id}/` | Eliminar o desvincular un tótem del sistema. | Admin / Secretaría |

---

## 4. Módulo de Plantillas y Widgets

| Método | Endpoint | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/widgets/` | Listar catálogo de widgets disponibles y sus dimensiones por defecto. | Público |
| `POST` | `/api/widgets/` | Crear un nuevo widget en el sistema. | Admin / Secretaría |
| `PUT, PATCH, DELETE`| `/api/widgets/{id}/` | Modificar o desactivar un widget. *(DELETE bloqueado si está en uso)*. | Admin / Secretaría |
| `GET` | `/api/plantillas/` | Listar plantillas activas con sus widgets y posiciones anidadas. | Público |
| `POST` | `/api/plantillas/` | Crear una nueva plantilla de pantalla. | Admin / Secretaría |
| `PUT, PATCH, DELETE`| `/api/plantillas/{id}/` | Modificar o eliminar una plantilla. *(Notifica en tiempo real a los tótems)*. | Admin / Secretaría |
| `GET, POST` | `/api/plantilla-widgets/` | Asociar un widget a una plantilla definiendo fila, columna y tamaño en el grid. | Admin / Secretaría |
| `PUT, PATCH, DELETE`| `/api/plantilla-widgets/{id}/` | Modificar la posición de un widget o quitarlo de la plantilla. | Admin / Secretaría |

---

## 5. Módulo Académico

| Método | Endpoint | Descripción | Parámetros / Notas | Autenticación |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/carreras/` | Listar todas las carreras universitarias. | Soporta ordenamiento | Público |
| `POST` | `/api/carreras/` | Crear nueva carrera. | - | Admin / Secretaría |
| `GET, PUT, PATCH, DELETE` | `/api/carreras/{id}/` | Detalle, edición y baja de carrera. | - | Admin / Secretaría |
| `GET` | `/api/materias/` | Listar asignaturas académicas. | Búsqueda por nombre | Público |
| `POST` | `/api/materias/` | Crear nueva materia. | - | Admin / Secretaría |
| `GET, PUT, PATCH, DELETE` | `/api/materias/{id}/` | Detalle, edición y baja de materia. | - | Admin / Secretaría |
| `GET` | `/api/plan-materias/` | Listar relación carrera-materia por plan. | Filtros por carrera/nivel | Público |
| `POST, PUT, PATCH, DELETE` | `/api/plan-materias/[{id}/]`| Crear o modificar asociación curricular. | - | Admin / Secretaría |
| `GET` | `/api/comisiones/` | Listar comisiones y cursos. | Filtro por materia | Público |
| `POST, PUT, PATCH, DELETE` | `/api/comisiones/[{id}/]` | Crear o modificar comisiones. | - | Admin / Secretaría |
| `GET` | `/api/horarios/` | Listar horarios de cursada vigentes. | Filtro por día/carrera/materia | Público |
| `POST, PUT, PATCH, DELETE` | `/api/horarios/[{id}/]` | Crear o modificar horarios de cursado. | - | Admin / Secretaría |
| `POST` | `/api/horarios/import_csv/` | **Carga masiva de horarios vía archivo CSV.** | `multipart/form-data` (`file`) | Admin / Secretaría |
| `GET` | `/api/mesas-examen/` | Listar turnos y mesas de exámenes finales. | Filtro por turno/fecha | Público |
| `POST, PUT, PATCH, DELETE` | `/api/mesas-examen/[{id}/]` | Crear o modificar mesas de examen. | - | Admin / Secretaría |
| `POST` | `/api/mesas-examen/import_csv/`| **Carga masiva de mesas vía archivo CSV.** | `multipart/form-data` (`file`) | Admin / Secretaría |

---

## 6. Módulo de Comunicación, Eventos y Calendario

| Método | Endpoint | Descripción | Parámetros / Notas | Autenticación |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/noticias/` | Listar noticias institucionales vigentes. | Orden descendente por fecha | Público |
| `POST, PUT, PATCH, DELETE` | `/api/noticias/[{id}/]` | Crear, editar o dar de baja noticias. | - | Admin / Secretaría |
| `GET` | `/api/eventos/` | Listar cursos, talleres y charlas extracurriculares.| Filtro por fecha | Público |
| `POST, PUT, PATCH, DELETE` | `/api/eventos/[{id}/]` | Crear o modificar eventos institucionales. | - | Admin / Secretaría |
| `GET` | `/api/avisos/` | Listar histórico de avisos y suspensiones. | - | Público |
| `GET` | `/api/avisos-activos/` | **Avisos y alertas urgentes para la fecha actual.**| Optimizado para el tótem | Público |
| `POST, PUT, PATCH, DELETE` | `/api/avisos/[{id}/]` | Crear o gestionar suspensiones y alertas. | - | Admin / Secretaría |
| `GET` | `/api/calendario/eventos/` | Listar eventos e hitos del calendario académico. | Soporta rangos de fechas | Público |
| `POST, PUT, PATCH, DELETE` | `/api/calendario/eventos/[{id}/]` | Crear o modificar fechas del calendario. | - | Admin / Secretaría |
| `POST` | `/api/calendario/bulk/` | Carga masiva de eventos de calendario. | JSON de eventos | Admin / Secretaría |

---

## 7. Módulo de Espacios y Mapa Interactivo

| Método | Endpoint | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/espacios/` | Listado de espacios físicos (aulas, laboratorios, secretarías, oficinas). | Público |
| `GET` | `/api/ubicaciones-mapa/` | Listar polígonos e identificadores SVG del plano interactivo por piso. | Público |
| `POST, PUT, PATCH, DELETE` | `/api/ubicaciones-mapa/[{id}/]` | Crear o gestionar ubicaciones en el plano SVG del tótem. | Admin / Secretaría |

---

## 8. Canales WebSocket (`/ws`)

| Ruta WebSocket | Tipo | Eventos Transmitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `/ws/totem/{codigo}/` | Temporal | `vinculado` | Escucha activa del tótem no enlazado mientras muestra su código en pantalla. |
| `/ws/totem/config/?token={token}` | Permanente | `configuracion_actualizada`, `contenido_actualizado` | Canal en tiempo real del tótem vinculado para invalidación reactiva de contenidos y cambios de plantilla. |
