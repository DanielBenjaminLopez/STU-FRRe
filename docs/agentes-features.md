# Guía para agentes: crear y eliminar features (widgets)

Documento operativo para agentes (y personas) que necesiten agregar o quitar una
feature/widget del tótem. **Usar siempre los scripts; no crear los archivos a mano.**

## Comandos

Se ejecutan desde la raíz del repo o desde `front/`. Requieren solo Node/npm
(no hace falta Docker ni `npm install` en la raíz).

```bash
npm run feature:add -- <Nombre>             # crea la feature y la registra
npm run feature:add -- <Nombre> --no-register   # solo crea la carpeta
npm run feature:delete -- <Nombre>          # pide confirmación
npm run feature:delete -- <Nombre> --yes    # sin confirmación (no interactivo)
npm run feature:delete -- <Nombre> --force  # permite borrar features originales
```

- Sin `<Nombre>` el script lo pregunta de forma interactiva. **Los agentes deben
  pasarlo por argumento** (y `--yes` al borrar) para evitar prompts bloqueantes.
- El nombre admite `Mi Widget`, `mi-widget` o `MiWidget`; se normaliza a:
  - carpeta: kebab-case (`mi-widget`)
  - tipo de widget / archivo api: camelCase (`miWidget`)
  - componente / hook: PascalCase (`MiWidget`, `useMiWidget`)
- Los argumentos sin comillas se unen en un solo nombre (`-- Mi Widget`).

Scripts: `front/scripts/feature-add.mjs` y `front/scripts/feature-delete.mjs`.

## Qué hace `feature:add`

Crea `front/src/features/<kebab>/`:

| Archivo | Rol |
| --- | --- |
| `index.ts` | Entrypoint público: exporta `<Pascal>`, `<Pascal>Full`, `use<Pascal>` |
| `api/<camel>.ts` | Tipos y `fetch<Pascal>()` **mockeado** (datos fijos + delay) |
| `hooks/use<Pascal>.ts` | Carga datos; devuelve `{ items, loading, error }` |
| `components/<Pascal>.tsx` | Versión **base**: widget chico dentro de la plantilla |
| `components/<Pascal>Full.tsx` | Versión **full**: overlay a pantalla completa ("Ver más") |
| `__tests__/<Pascal>.test.tsx` | Test de ejemplo con el hook mockeado |

Además (salvo `--no-register`) modifica:

1. `front/src/features/widgets/registry.ts`: agrega el import y la entrada
   `<camel>` (colSpan 4, rowSpan 2, color gris por defecto).
2. `back/api/widgets_manifest.json`: agrega
   `{ nombre, tipo, col_tam_default, fila_tam_default }`.

El backend ejecuta `python manage.py sync_widgets` en cada arranque
(`back/entrypoint.sh`, después de `migrate`). Ese comando crea en la BD los widgets
del manifiesto que falten (`get_or_create` por `tipo`: idempotente, no pisa ni
borra). **No se usan migraciones por widget.**

## Pasos posteriores a `feature:add`

1. **Crear la fila en la BD** si el backend ya está corriendo:
   `docker compose exec backend python manage.py sync_widgets`.
   Sin la fila, el widget aparece en la paleta pero **desaparece al guardar la
   plantilla**.
2. Formatear: `cd front && npx prettier --write src/features/<kebab>`.
3. Reemplazar el mock de `api/<camel>.ts` por un fetch real: agregar el endpoint en
   `front/src/shared/api/endpoints.ts` y usar `totemFetch` (tótem) o `apiFetch`
   (admin) de `shared/api/client`. Si necesita backend propio, crear
   modelo/serializer/vista bajo `back/api`.
4. Ajustar diseño y tamaño (`colSpan`/`rowSpan`, `color`) en `registry.ts` y las
   clases de los componentes.
5. Agregar el widget a una plantilla desde el admin y guardar.
6. Validar: `cd front && npm test -- <kebab>` y `npm run lint`.

## Qué hace `feature:delete`

- Borra `front/src/features/<kebab>/`.
- Quita el import y la entrada de `registry.ts`.
- Quita la entrada de `back/api/widgets_manifest.json`.
- **No borra la fila de la BD.** Imprime el comando; ejecutarlo si corresponde:

  ```bash
  docker compose exec backend python manage.py shell -c \
    "from api.models import Widget; print(Widget.objects.filter(tipo='<camel>').delete())"
  ```

  Borrar el `Widget` elimina también sus `PlantillaWidget` (se quita de las
  plantillas que lo usaban).
- **Protección:** solo permite borrar features presentes en el manifiesto (las
  creadas con `feature:add`). Las originales (`examenes`, `horarios`, `mapa`,
  `calendario`, `noticias`, `layout`, `totems`, `widgets`) requieren `--force`;
  no usarlo salvo pedido explícito, porque dejan referencias rotas (admin, tests,
  seed).
- Si el import en `registry.ts` está combinado con otros
  (`import { A, B } from ...`), el script avisa y hay que corregirlo a mano.

## Reglas y límites

- No editar `widgets_manifest.json` a mano salvo para corregir inconsistencias;
  debe reflejar solo las features generadas por script.
- Los widgets originales se siguen creando por migraciones y `seed_data.py`; no
  migrarlos al manifiesto sin pedido explícito.
- `tipo` debe ser único y coincidir entre `registry.ts`, el manifiesto y la BD.
- Ante un fallo de registro automático (`⚠ No se pudo registrar…`), hacer el
  registro manual siguiendo `docs/arquitectura-features.md`.
- Verificación rápida tras `feature:add`/`delete`: `git status` debe mostrar solo
  la carpeta de la feature, `registry.ts` y `widgets_manifest.json`.
