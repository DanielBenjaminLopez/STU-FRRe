# Arquitectura por Features

El frontend organiza los módulos funcionales bajo `front/src/features`. Cada
feature tiene un entrypoint público y puede incorporar sus componentes, hooks,
cliente API, tipos, assets y tests. El registro en
`front/src/features/widgets/registry.ts` es la única fuente utilizada para
resolver widgets en el tótem y en el editor de plantillas.

La API expone sus límites funcionales bajo `back/api/features`. Las vistas de
widgets, plantillas y tótems viven físicamente dentro de sus respectivos
módulos. Los modelos y serializers compartidos de Django permanecen en `api`
por ahora para conservar el app label y las migraciones existentes; no son
fachadas públicas de los features.

Para agregar un widget nativo:

1. Crear `front/src/features/<nombre>/`.
2. Incorporar allí el componente, hooks, API, tipos y tests del widget.
3. Exportar el componente desde el entrypoint de la feature.
4. Agregar su definición a `features/widgets/registry.ts`.
5. Crear o actualizar el registro correspondiente en el backend.

El código compartido debe permanecer en `shared` únicamente cuando no
pertenezca a un dominio específico.
