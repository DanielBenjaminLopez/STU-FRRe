# Plan de Pruebas — Panel de Administración

## Sección: Noticias y Eventos (`/admin/noticias`)

### CRUD de Noticias

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| N1 | Crear noticia con campos obligatorios | Click "Cargar noticia" → completar título, contenido, fecha publicación → Guardar | Noticia aparece en la tabla con título y fecha correctos |
| N2 | Crear noticia sin título | Click "Cargar noticia" → dejar título vacío → Guardar | Mensaje de validación "Título es obligatorio" |
| N3 | Crear noticia sin contenido | Click "Cargar noticia" → completar título → dejar contenido vacío → Guardar | Mensaje de validación |
| N4 | Crear noticia con imagen | Completar campos + URL de imagen válida → Guardar | Miniatura aparece en columna "Imagen" de la tabla |
| N5 | Crear noticia con enlace | Completar campos + URL de enlace → Guardar | Noticia se crea correctamente |
| N6 | Editar noticia existente | Click ícono editar → modificar título → Guardar | Título se actualiza en la tabla |
| N7 | Editar imagen de noticia | Click editar → cambiar URL de imagen → Guardar | Nueva miniatura se muestra |
| N8 | Eliminar noticia | Click ícono eliminar → confirmar en modal | Noticia desaparece de la tabla |
| N9 | Cancelar eliminación | Click ícono eliminar → cancelar en modal | Noticia permanece en la tabla |
| N10 | Buscar noticia | Escribir en campo de búsqueda | Tabla filtra por título coincidente |
| N11 | Buscar noticia inexistente | Escribir texto sin coincidencias | Tabla muestra "No se encontraron..." |

### CRUD de Eventos

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| E1 | Crear evento completo | Click "Cargar evento" → completar todos los campos → Guardar | Evento aparece en la tabla con badge "Evento" |
| E2 | Crear evento sin título | Click "Cargar evento" → dejar título vacío → Guardar | Mensaje de validación |
| E3 | Crear evento sin tipo | Click "Cargar evento" → completar título → dejar tipo sin seleccionar → Guardar | Mensaje de validación |
| E4 | Crear evento con fecha fin anterior a inicio | Configurar fecha fin < fecha inicio → Guardar | Mensaje "La fecha de fin debe ser posterior a la fecha de inicio" |
| E5 | Crear evento con duración < 1 día | Configurar inicio y fin en el mismo día → Guardar | Mensaje "El evento debe tener una duración mínima de 1 día" |
| E6 | Crear evento con espacio | Seleccionar espacio del dropdown → Guardar | Evento se crea con espacio asociado |
| E7 | Editar evento | Click editar → modificar título → Guardar | Cambios persisten |
| E8 | Eliminar evento | Click eliminar → confirmar | Evento desaparece de la tabla |

### Sincronización

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| S1 | Sincronizar desde UTN | Click "Sincronizar desde UTN" | Spinner → mensaje de resultado → tabla se actualiza |
| S2 | Sincronizar con error de red | Desconectar red → sincronizar | Mensaje de error "Error al sincronizar" |
| S3 | Sincronizar múltiples veces | Click sincronizar 3 veces seguidas | No se duplican noticias |

### Modal de Detalle

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| D1 | Ver detalle de noticia | Click en fila de noticia | Modal se abre con imagen, título, contenido, fecha |
| D2 | Ver detalle de evento | Click en fila de evento | Modal muestra badge evento, fecha, espacio |
| D3 | Cerrar modal con botón | Click "Cerrar" | Modal se cierra |
| D4 | Cerrar modal con Escape | Presionar tecla Escape | Modal se cierra |
| D5 | Cerrar modal click fuera | Click en overlay oscuro | Modal se cierra |
| D6 | Noticia sin imagen | Abrir detalle de noticia sin imagen | Modal se abre sin sección de imagen |

### Carrusel

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| C1 | Carrusel se muestra | Tener noticias en la tabla | Carrusel aparece arriba de la tabla |
| C2 | Carrusel con 1 noticia | Tener solo 1 noticia | Carrusel muestra esa noticia |
| C3 | Carrusel sin noticias | No tener noticias | Carrusel no se renderiza |

---

## Sección: Plantillas (`/admin/plantillas`)

### CRUD

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| P1 | Crear plantilla vacía | Click "Crear plantilla" | Nuevo tab aparece con nombre "Nueva plantilla" y badge "nuevo" |
| P2 | Renombrar plantilla | Editar nombre en el input del canvas | Nombre se actualiza en el tab |
| P3 | Eliminar plantilla | Click ícono basura → confirmar | Plantilla desaparece del tab |
| P4 | Cancelar eliminación | Click ícono basura → cancelar | Plantilla permanece |
| P5 | Eliminar última plantilla | Eliminar todas las plantillas | Empty state "Todavía no hay plantillas" |
| P6 | Crear desde empty state | Click "Crear plantilla" en empty state | Se crea plantilla y se muestra el canvas |

### Drag & Drop

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| D1 | Arrastrar widget al canvas | Drag desde paleta → soltar en grilla | Widget aparece en la posición correcta |
| D2 | Reubicar widget en canvas | Drag widget dentro del canvas → soltar | Widget cambia de posición |
| D3 | Soltar fuera de la grilla | Drag widget → soltar fuera del área válida | Toast "Soltá el widget dentro de la grilla de la plantilla" |
| D4 | Colisionar widgets | Arrastrar widget encima de otro | Toast "No hay espacio disponible en esa posición" |
| D5 | Verificar tamaños de widgets | Arrastrar Horarios, Examenes, Calendario, Mapa | Cada widget ocupa su tamaño correcto en la grilla |

### Guardado

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| G1 | Guardar plantilla nueva | Agregar widget → click "Guardar plantilla" | Toast "Plantilla guardada correctamente" |
| G2 | Guardar plantilla modificada | Mover widget → guardar | Cambios persisten al recargar |
| G3 | Indicador de cambios | Modificar plantilla | Punto amarillo aparece en el tab |
| G4 | Limpiar indicador al guardar | Modificar → guardar | Punto amarillo desaparece |
| G5 | Guardar con nombre vacío | Borrar nombre → guardar | Se guarda con nombre vacío (verificar comportamiento) |

### Cargar al tótem

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| T1 | Cargar plantilla al tótem | Click "Cargar al tótem" | Toast "Plantilla cargada al tótem correctamente" |
| T2 | Cargar plantilla sin guardar | Modificar → click "Cargar al tótem" sin guardar | Toast "Guardá la plantilla antes de cargarla al tótem" |
| T3 | Botón deshabilitado sin tótem | No tener tótem vinculado | Botón "Cargar al tótem" deshabilitado |
| T4 | Botón deshabilitado para nueva | Crear plantilla nueva (sin guardar) | Botón "Cargar al tótem" deshabilitado |

### Tabs

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| B1 | Cambiar entre tabs | Click en tab diferente | Canvas muestra la plantilla seleccionada |
| B2 | Badge "nuevo" | Crear plantilla | Badge "nuevo" visible en el tab |
| B3 | Badge "modificado" | Editar plantilla guardada | Punto amarillo aparece |
| B4 | Múltiples tabs | Crear 5 plantillas | Todos los tabs se renderizan sin overflow |

---

## Sección: Calendario Académico (`/admin/calendario-avisos`)

### Interacción

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| A1 | Seleccionar tipo de evento | Click en "Inicio Cuatrimestre" | Botón se activa con color, icono e instrucción "Hacé click en un día" |
| A2 | Deseleccionar tipo | Click en tipo ya seleccionado | Se desactiva, vuelve a "Elegí un tipo de evento" |
| A3 | Marcar día (tipo day) | Seleccionar tipo day → click en día | Día se marca con color del tipo |
| A4 | Desmarcar día | Click en día ya marcado | Día se desmarca |
| A5 | Seleccionar rango (tipo range) | Seleccionar tipo range → drag en calendario | Rango se marca con color continuo |
| A6 | Arrastrar rango inverso | Drag de derecha a izquierda | Rango se marca correctamente |
| A7 | Verificar eventos en resumen | Marcar 3 eventos | Panel lateral muestra 3 eventos con badges |
| A8 | Eliminar evento del resumen | Click "×" en evento del resumen | Evento se elimina del calendario |

### Guardado

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| V1 | Guardar con eventos | Marcar eventos → click "Guardar (N)" | Modal de confirmación se abre |
| V2 | Confirmar guardado | Click "Guardar" en modal | Toast éxito, eventos persisten |
| V3 | Cancelar guardado | Click "Cancelar" en modal | Modal se cierra, nada cambia |
| V4 | Guardar sin eventos | No marcar nada | Botón "Guardar (0)" deshabilitado |

### Selector de año

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| Y1 | Cambiar año | Seleccionar 2025 | Calendario muestra 2025, eventos del año |
| Y2 | Año sin eventos | Seleccionar año sin datos | Calendario vacío, resumen sin eventos |

---

## Cross-cutting

| # | Caso de prueba | Pasos esperados | Resultado esperado |
|---|---|---|---|
| X1 | Navegar entre secciones | Noticias → Plantillas → Calendario → Noticias | No hay estado residual entre secciones |
| X2 | Refrescar página | F5 en cada sección | Datos se recargan desde API correctamente |
| X3 | Sidebar activo | Navegar a cada sección | Ítem activo resaltado en el sidebar |
| X4 | Header consistente | Navegar entre secciones | Header muestra logo y nombre de sección correctamente |
| X5 | Responsive | Redimensionar ventana | Layout se adapta sin overflow ni cortes |
