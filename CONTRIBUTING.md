## Guia de Flujo de Trabajo y Reglas de Repositorio

Este repositorio está conectado directamente al tablero de Jira. 

### Reglas de Nomenclatura de Ramas

Toda nueva rama debe crearse a partir de la rama `develop`. Queda estrictamente prohibido ramificar desde `main` a menos que sea una reparación de emergencia en producción.

* **Estructura obligatoria:** `tipo/CLAVE-descripcion-breve`
* **Sintaxis estricta:** Solo minúsculas, números y guiones medios (los guines se agregan automaticamente). Cero espacios, cero tildes, cero eñes, cero caracteres especiales.
* **Tipos admitidos:** `feature`, `bugfix`, `hotfix`, `docs`.

**Ejemplos**

* Correcto: `docs/SCRUM-30-guia-de-flujo`
* Incorrecto: `Docs_SCRUM_30_Guía_Flujo` (Usa mayúsculas, guiones bajos y tildes).

### Formato de Mensajes de Commit

Los commits no son un diario personal; son un registro de auditoría. Jira lee estos mensajes para vincular el código a las tarjetas.
    
* **Estructura obligatoria:** `CLAVE: descripción clara del cambio`
* **Regla técnica:** El inicio del mensaje debe ser exactamente la clave de Jira en mayúsculas, seguida de dos puntos y un espacio para que quede registrado.

**Ejemplos**

* Correcto: `SCRUM-30: agrega instructivo de integracion con jira al readme`
* Incorrecto: `agregue el readme para el ticket 30` (No activa la automatización).

### Sincronizacion con el Tablero de Jira

El movimiento de las tareas en el tablero está automatizado por las acciones en GitHub. El equipo no debe arrastrar las tarjetas manualmente durante el desarrollo.

| Accion en GitHub | Estado Resultante en Jira |
| --- | --- |
| Crear una rama con la clave correcta | **En Curso** |
| Abrir un Pull Request hacia `develop` | **En Pruebas** |
| Aprobar y fusionar el PR en `develop` | **Listo para Lanzamiento** |

### Ciclo de Despliegue de los Lunes

El código fusionado en `develop` y marcado como "Listo para Producción" en Jira se encuentra en un entorno de preparación. No está en Producción.

Los despliegues a producción se realizan únicamente después de confirmar que el despliegue fue exitoso y el servidor es estable, en las reuniones semanales se moverán manualmente las tarjetas desde "Listo para Producción" hacia **Finalizado** en el tablero de Jira, cerrando oficialmente el ciclo de la tarea.
