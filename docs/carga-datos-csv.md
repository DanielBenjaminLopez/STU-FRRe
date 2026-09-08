# Guía de carga de datos con archivos CSV / Excel

Esta guía detalla el procedimiento para preparar, generar y cargar datos de forma masiva en el **Sistema de Tótems Interactivos**, tanto a través del panel de **Django Admin** como desde la interfaz del **Panel Administrativo Web**.

---

## 1. Reglas Generales de Preparación en Microsoft Excel

Para que el backend procese adecuadamente los datos y no se produzcan fallos de codificación o parseo, el archivo Excel debe exportarse siguiendo estrictamente estas pautas:

### Formato de Guardado
Al guardar desde Excel, en el desplegable **Tipo**, seleccionar:
> **CSV UTF-8 (delimitado por comas) (*.csv)**

> **Separador de campos (Coma vs. Punto y coma):**
> En sistemas Windows configurados en español (Argentina/Latinoamérica), Excel suele usar por defecto el **punto y coma (`;`)** en lugar de la **coma (`,`)**.
> Si el archivo exportado contiene punto y coma, puedes abrirlo con un editor de texto y verificarlo, o reemplazar `;` por `,`. El backend espera separación por coma `,`.

### Codificación y Acentos
- Utilizar **UTF-8 sin BOM**. Esto garantiza que las vocales acentuadas (`á`, `é`, `í`, `ó`, `ú`) y la letra `ñ` no se transformen en caracteres extraños (ej: `Ã¡`).

### Formatos de Fechas y Horas
- **Fechas**: Formato estándar ISO `AAAA-MM-DD` (ejemplo: `2026-12-15`).
- **Horas**: Formato de 24 horas `HH:MM` (ejemplo: `08:00`, `14:30`, `21:15`). No ingresar segundos ni sufijos AM/PM.

---

## 2. Orden Obligatorio de Importación

Dado que la base de datos es relacional, existen dependencias de claves foráneas. **Debe respetarse el siguiente orden de carga**; de lo contrario, el sistema rechazará filas porque los registros padres no existirán:

1. **Espacios Físicos**: Aulas, laboratorios, oficinas y dependencias.
2. **Carreras**: Carreras dictadas en la facultad.
3. **Materias**: Asignaturas académicas.
4. **Plan de Materias**: Relación entre carrera, materia, año/nivel, modalidad y plan de estudio.
5. **Comisiones**: Comisiones o cursos por cada materia de un plan.
6. **Horarios de Cursado**: Asignación de días, horas y aulas a cada comisión.
7. **Mesas de Examen**: Turnos, fechas, horas y aulas para exámenes finales.

---

## 3. Especificación de Columnas y Ejemplos de Archivos

A continuación se detalla la estructura requerida para cada archivo CSV junto con un ejemplo de cómo debe construirse la tabla.

### 3.1. Espacios Físicos
- **Columnas:**
  | Columna | Obligatorio | Valores permitidos / Ejemplo | Descripción |
  | :--- | :--- | :--- | :--- |
  | `nombre` | **Sí** | `Aula 101`, `Aula Magna` | Nombre único identificatorio del espacio. |
  | `tipo` | **Sí** | `aula`, `laboratorio_informatico`, `secretaria`, `departamento`, `otro` | Categoría del espacio físico. |
  | `tipo_otro`| Condicional | `Biblioteca` | Requerido **solo** si `tipo` es `otro`. |
  | `piso` | **Sí** | `planta_baja`, `primer_piso`, `segundo_piso` | Nivel en el que se ubica. |

- **Ejemplo CSV:**
  ```csv
  nombre,tipo,tipo_otro,piso
  Aula Magna,aula,,planta_baja
  Aula 101,aula,,primer_piso
  Aula 201,aula,,segundo_piso
  Laboratorio de Redes,laboratorio_informatico,,primer_piso
  Secretaría Académica,secretaria,,planta_baja
  ```

---

### 3.2. Carreras
- **Columnas:**
  | Columna | Obligatorio | Ejemplo | Descripción |
  | :--- | :--- | :--- | :--- |
  | `nombre` | **Sí** | `Ingeniería en Sistemas de Información` | Nombre oficial completo. |
  | `codigo` | No | `ISI`, `IEM`, `IQ`, `LAR`, `TUP` | Abreviatura o código de la carrera. |
  | `tipo` | No | `grado`, `tecnica`, `posgrado`, `diplomatura` | Tipo de carrera (por defecto `grado`). |

- **Ejemplo CSV:**
  ```csv
  nombre,codigo,tipo
  Ingeniería en Sistemas de Información,ISI,grado
  Ingeniería Electromecánica,IEM,grado
  Ingeniería Química,IQ,grado
  Tecnicatura Universitaria en Programación,TUP,tecnica
  ```

---

### 3.3. Materias
- **Columnas:**
  | Columna | Obligatorio | Ejemplo | Descripción |
  | :--- | :--- | :--- | :--- |
  | `nombre` | **Sí** | `Sistemas Operativos`, `Análisis Matemático I` | Nombre unívoco de la asignatura. |

- **Ejemplo CSV:**
  ```csv
  nombre
  Algoritmos y Estructuras de Datos
  Sistemas Operativos
  Bases de Datos
  Ingeniería de Software
  Física I
  ```

---

### 3.4. Plan - Materias
- **Columnas:**
  | Columna | Obligatorio | Valores permitidos | Descripción |
  | :--- | :--- | :--- | :--- |
  | `carrera` | **Sí** | Nombre exacto de la carrera existente | Debe coincidir con una carrera ya cargada. |
  | `materia` | **Sí** | Nombre exacto de la materia existente | Debe coincidir con una materia ya cargada. |
  | `nivel` | **Sí** | `primero`, `segundo`, `tercero`, `cuarto`, `quinto` | Año de cursada en el plan. |
  | `modalidad` | **Sí** | `anual`, `cuatrimestral` | Régimen de cursado. |
  | `cuatrimestre`| Condicional | `primero`, `segundo` | Obligatorio si modalidad es `cuatrimestral`; vacío si es `anual`. |
  | `plan_estudio`| No | `2023`, `2008` | Plan de estudio (por defecto `2023`). |

- **Ejemplo CSV:**
  ```csv
  carrera,materia,nivel,modalidad,cuatrimestre,plan_estudio
  Ingeniería en Sistemas de Información,Algoritmos y Estructuras de Datos,primero,anual,,2023
  Ingeniería en Sistemas de Información,Sistemas Operativos,segundo,cuatrimestral,primero,2023
  Ingeniería en Sistemas de Información,Bases de Datos,tercero,cuatrimestral,segundo,2023
  ```

---

### 3.5. Comisiones
- **Columnas:**
  | Columna | Obligatorio | Ejemplo | Descripción |
  | :--- | :--- | :--- | :--- |
  | `carrera` | **Sí** | `Ingeniería en Sistemas de Información` | Carrera a la que pertenece la materia. |
  | `materia` | **Sí** | `Algoritmos y Estructuras de Datos` | Materia de la comisión. |
  | `plan_estudio`| No | `2023` (por defecto) | Plan de estudio asociado. |
  | `nombre` | **Sí** | `1K01`, `1K02`, `Comisión A` | Identificador de la comisión / curso. |

- **Ejemplo CSV:**
  ```csv
  carrera,materia,plan_estudio,nombre
  Ingeniería en Sistemas de Información,Algoritmos y Estructuras de Datos,2023,1K01
  Ingeniería en Sistemas de Información,Algoritmos y Estructuras de Datos,2023,1K02
  Ingeniería en Sistemas de Información,Sistemas Operativos,2023,2K01
  ```

---

### 3.6. Horarios de Cursado
- **Columnas y Alias aceptados:**
  | Columna | Alias reconocidos | Obligatorio | Formato / Valores |
  | :--- | :--- | :--- | :--- |
  | `carrera` | `Carrera` | **Sí** | Nombre de la carrera. |
  | `materia` | `Materia` | **Sí** | Nombre de la materia. |
  | `comision` | `comision_nombre`, `nombre_comision`, `curso`, `Curso` | **Sí** | Nombre de la comisión (ej: `1K01`). |
  | `espacio` | `aula`, `Aula`, `AULA`, `Espacio`, `laboratorio` | No | Nombre exacto de un Espacio cargado. |
  | `dia_semana` | `dia`, `día`, `Dia`, `Día`, `DIA` | **Sí** | `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado` (o abreviaturas `lun`, `mar`, etc.). |
  | `hora_inicio`| `hora_ini` | **Sí** | `HH:MM` (ej: `08:00`). |
  | `hora_fin` | `hora_final` | **Sí** | `HH:MM` (ej: `12:00`). |
  | `plan_estudio`| `Plan_Estudio` | No | `2023` (por defecto). |

- **Ejemplo CSV:**
  ```csv
  carrera,materia,comision,espacio,dia_semana,hora_inicio,hora_fin,plan_estudio
  Ingeniería en Sistemas de Información,Algoritmos y Estructuras de Datos,1K01,Aula 101,lunes,08:00,12:00,2023
  Ingeniería en Sistemas de Información,Algoritmos y Estructuras de Datos,1K01,Laboratorio de Redes,miercoles,08:00,12:00,2023
  Ingeniería en Sistemas de Información,Sistemas Operativos,2K01,Aula 201,martes,14:00,18:00,2023
  ```

---

### 3.7. Mesas de Examen
- **Columnas y Alias aceptados:**
  | Columna | Alias reconocidos | Obligatorio | Formato / Valores |
  | :--- | :--- | :--- | :--- |
  | `carrera` | `Carrera` | **Sí** | Nombre de la carrera. |
  | `materia` | `Materia` | **Sí** | Nombre de la materia. |
  | `espacio` | `aula`, `Aula`, `Espacio` | **Sí** | Nombre exacto del aula o espacio. |
  | `fecha` | `Fecha` | **Sí** | `AAAA-MM-DD` (ej: `2026-12-15`). |
  | `hora` | `Hora` | **Sí** | `HH:MM` (ej: `08:30`). |
  | `turno` | `Turno` | **Sí** | `febrero`, `marzo`, `abril`, `junio`, `agosto`, `septiembre`, `octubre`, `diciembre`. |
  | `plan_estudio`| `Plan_Estudio` | No | `2023` o `2008`. |

- **Ejemplo CSV:**
  ```csv
  carrera,materia,espacio,fecha,hora,turno,plan_estudio
  Ingeniería en Sistemas de Información,Algoritmos y Estructuras de Datos,Aula Magna,2026-12-15,08:30,diciembre,2023
  Ingeniería en Sistemas de Información,Sistemas Operativos,Aula 101,2026-12-18,14:00,diciembre,2023
  ```

---

## 4. Métodos de Carga

### Método A: A través de Django Admin (Recomendado para carga inicial completa)
El panel nativo de Django cuenta con `django-import-export`, lo que permite previsualizar altas y modificaciones antes de impactar en la base de datos.

1. Acceder al panel en `http://localhost:8000/admin/` con credenciales de superusuario.
2. Navegar a la sección del modelo a importar (por ejemplo, **Horarios de cursado** o **Mesas de exámen**).
3. En la esquina superior derecha, hacer clic en el botón **Importar**.
4. Seleccionar el archivo `.csv` desde el equipo.
5. En el selector **Formato**, elegir **csv**.
6. Hacer clic en **Enviar**.
7. Se presentará una pantalla de **Vista Previa** mostrando:
   - Filas que se crearán en color verde (nuevos registros).
   - Filas que se actualizarán en color amarillo.
   - Posibles errores de validación en rojo si algún campo es inválido.
8. Si no hay errores, hacer clic en **Confirmar importación** para guardar definitivamente los cambios.

### Método B: Desde el Panel de Administración Web (Frontend)
El panel web administrativo del frontend ofrece una sección específica para importar horarios y mesas de forma directa:

1. Ingresar al frontend en `http://localhost:5173/admin/`.
2. Iniciar sesión con usuario administrador.
3. Navegar a la sección correspondiente:
   - **Horarios** (`/admin/horarios`) -> Botón **Importar CSV**.
   - **Mesas de Examen** (`/admin/mesas`) -> Botón **Importar CSV**.
4. Arrastrar o seleccionar el archivo `.csv`.
5. El sistema enviará el archivo al endpoint correspondiente (`/api/horarios/import_csv/` o `/api/mesas-examen/import_csv/`).
6. Se recibirá una notificación de confirmación con la cantidad de filas procesadas con éxito o el detalle de los errores encontrados.

---

## 5. Diagnóstico de Errores Comunes

| Error Reportado | Causa Frecuente | Solución |
| :--- | :--- | :--- |
| `No existe la comisión 'X' para la materia 'Y'` | La comisión no fue creada previamente o el nombre de la materia tiene diferencias tipográficas. | Cargar primero la comisión en `Comisiones` verificando que coincida exactamente con la materia y carrera. |
| `No existe el espacio 'X' en la base de datos` | El aula o laboratorio no existe en la tabla de `Espacios`. | Crear el espacio en `Espacios` antes de asociar el horario o mesa. |
| `Formato de hora inválido ('08:00:00')` | La hora incluye segundos o texto adicional. | Usar únicamente `HH:MM` (ejemplo `08:00`). |
| `Debe indicar el cuatrimestre cuando la modalidad es Cuatrimestral` | En `PlanMateria`, se indicó modalidad `cuatrimestral` pero el campo `cuatrimestre` quedó vacío. | Completar con `primero` o `segundo`. |
| `El día de la semana 'X' no es válido` | El día contiene caracteres irreconocibles. | Usar `lunes`, `martes`, `miercoles`, `jueves`, `viernes` o `sabado`. |
