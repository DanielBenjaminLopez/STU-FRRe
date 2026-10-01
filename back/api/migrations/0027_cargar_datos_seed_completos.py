import csv
from pathlib import Path
from django.db import migrations
from django.db.models import Q

CSV_DIR = Path(__file__).resolve().parents[1] / "seed"


def get_rows(filepath):
    with open(filepath, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            yield {k.strip(): v.strip() for k, v in r.items() if k is not None and v is not None}


def normalizar_dia(d_raw):
    if not d_raw:
        return ""
    d = d_raw.strip().lower()
    d = d.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    mapping = {
        'lun': 'lunes', 'lunes': 'lunes',
        'mar': 'martes', 'martes': 'martes',
        'mie': 'miercoles', 'miercoles': 'miercoles',
        'jue': 'jueves', 'jueves': 'jueves',
        'vie': 'viernes', 'viernes': 'viernes',
        'sab': 'sabado', 'sabado': 'sabado',
        'dom': 'domingo', 'domingo': 'domingo',
    }
    return mapping.get(d, d)


def sin_tildes(s):
    return s.lower().replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')


def cargar_seeds(apps, schema_editor):
    Espacio = apps.get_model("api", "Espacio")
    Carrera = apps.get_model("api", "Carrera")
    Materia = apps.get_model("api", "Materia")
    PlanMateria = apps.get_model("api", "PlanMateria")
    Comision = apps.get_model("api", "Comision")
    HorarioCursado = apps.get_model("api", "HorarioCursado")

    if not CSV_DIR.exists():
        return

    all_csvs = list(CSV_DIR.glob("*.csv"))

    # 1. Espacios
    for p in [x for x in all_csvs if "espacio" in x.name.lower()]:
        for row in get_rows(p):
            nombre = row.get("nombre", "").strip()
            if not nombre:
                continue
            tipo = row.get("tipo", "aula").strip() or "aula"
            tipo_otro = row.get("tipo_otro", "").strip()
            piso = row.get("piso", "planta_baja").strip() or "planta_baja"
            Espacio.objects.update_or_create(
                nombre=nombre,
                defaults={"tipo": tipo, "tipo_otro": tipo_otro, "piso": piso},
            )

    # 2. Carreras
    tipo_carrera = {
        "grado": "grado", "tecnicatura": "tecnica", "tecnica": "tecnica",
        "posgrado": "posgrado", "diplomatura": "diplomatura",
    }
    for p in [x for x in all_csvs if "carrera" in x.name.lower()]:
        for row in get_rows(p):
            nombre = row.get("nombre", "").strip()
            codigo = row.get("codigo", "").strip()
            if not nombre:
                continue
            raw_tipo = row.get("tipo", "grado").strip().lower()
            tipo = tipo_carrera.get(raw_tipo, "grado")
            if codigo:
                Carrera.objects.update_or_create(
                    codigo=codigo,
                    defaults={"nombre": nombre, "tipo": tipo},
                )
            else:
                Carrera.objects.update_or_create(
                    nombre=nombre,
                    defaults={"tipo": tipo},
                )

    carreras_cache = list(Carrera.objects.all())

    def buscar_carrera(c_str):
        if not c_str:
            return None
        c_clean = c_str.strip()
        for c in carreras_cache:
            if c.codigo and c.codigo.lower() == c_clean.lower():
                return c
        for c in carreras_cache:
            if c.nombre.lower() == c_clean.lower() or c_clean.lower() in c.nombre.lower():
                return c
        c_st = sin_tildes(c_clean)
        for c in carreras_cache:
            if sin_tildes(c.nombre) == c_st or c_st in sin_tildes(c.nombre):
                return c
        return None

    # 3. Materias
    for p in [x for x in all_csvs if "materia" in x.name.lower() and "plan" not in x.name.lower()]:
        for row in get_rows(p):
            nombre = row.get("nombre", "").strip()
            if nombre:
                Materia.objects.get_or_create(nombre=nombre)

    # 4. Planes
    nivel_map = {
        "1": "primero", "primer año": "primero", "primero": "primero",
        "2": "segundo", "segundo año": "segundo", "segundo": "segundo",
        "3": "tercero", "tercer año": "tercero", "tercero": "tercero",
        "4": "cuarto", "cuarto año": "cuarto", "cuarto": "cuarto",
        "5": "quinto", "quinto año": "quinto", "quinto": "quinto",
    }
    cuatrimestre_map = {
        "1": "primero", "primero": "primero",
        "2": "segundo", "segundo": "segundo",
    }

    for p in [x for x in all_csvs if "plan" in x.name.lower()]:
        for row in get_rows(p):
            c_str = row.get("carrera", "").strip()
            m_str = row.get("materia", "").strip()
            if not c_str or not m_str:
                continue
            car = buscar_carrera(c_str)
            if not car:
                continue
            mat, _ = Materia.objects.get_or_create(nombre=m_str)
            nivel_raw = sin_tildes(row.get("nivel", "primero"))
            nivel = nivel_map.get(nivel_raw, "primero")
            modalidad = row.get("modalidad", "anual").strip().lower()
            if modalidad not in ["anual", "cuatrimestral"]:
                modalidad = "anual"
            cuatrimestre_raw = row.get("cuatrimestre", "").strip().lower()
            cuatrimestre = cuatrimestre_map.get(cuatrimestre_raw) if modalidad == "cuatrimestral" else None
            plan_estudio = row.get("plan_estudio", "2023").strip() or "2023"

            PlanMateria.objects.update_or_create(
                carrera=car,
                materia=mat,
                nivel=nivel,
                plan_estudio=plan_estudio,
                defaults={
                    "modalidad": modalidad,
                    "cuatrimestre": cuatrimestre,
                },
            )

    # Helper para buscar plan materia
    def buscar_plan_materia(c_str, m_str, plan_estudio_raw=None):
        car = buscar_carrera(c_str)
        raw_m = str(m_str)
        clean_m = raw_m.strip()
        m_filter = (
            Q(materia__nombre__iexact=clean_m)
            | Q(materia__nombre__iexact=raw_m)
            | Q(materia__nombre__istartswith=clean_m)
        )
        qs = PlanMateria.objects.filter(m_filter)
        if car:
            qs = qs.filter(carrera=car)
        if not qs.exists():
            return None
        if plan_estudio_raw and str(plan_estudio_raw).strip():
            qs_p = qs.filter(plan_estudio=str(plan_estudio_raw).strip())
            if qs_p.exists():
                return qs_p.first()
        for pref in ['2023', '2026', '2010', '2008', '2001', '1995']:
            qs_pref = qs.filter(plan_estudio=pref)
            if qs_pref.exists():
                return qs_pref.first()
        return qs.first()

    # 5. Comisiones
    for p in [x for x in all_csvs if "comision" in x.name.lower()]:
        for row in get_rows(p):
            c_str = row.get("carrera", "").strip()
            m_str = row.get("materia", "").strip()
            nom = (
                row.get("nombre")
                or row.get("Curso")
                or row.get("comision_nombre")
                or row.get("comision")
                or ""
            ).strip()
            plan_estudio = row.get("plan_estudio", "").strip() or None
            if not c_str or not m_str or not nom:
                continue
            pm = buscar_plan_materia(c_str, m_str, plan_estudio)
            if pm:
                Comision.objects.update_or_create(
                    plan_materia=pm,
                    nombre=nom,
                )

    # Helper para buscar comision
    def buscar_comision(c_str, m_str, c_nom, plan_estudio_raw=None):
        pm = buscar_plan_materia(c_str, m_str, plan_estudio_raw)
        c_clean = str(c_nom).strip()
        if pm:
            com = Comision.objects.filter(plan_materia=pm, nombre__iexact=c_clean).first()
            if com:
                return com
            coms = Comision.objects.filter(plan_materia=pm)
            if coms.count() == 1:
                return coms.first()

        car = buscar_carrera(c_str)
        raw_m = str(m_str)
        clean_m = raw_m.strip()
        m_filter = (
            Q(plan_materia__materia__nombre__iexact=clean_m)
            | Q(plan_materia__materia__nombre__iexact=raw_m)
            | Q(plan_materia__materia__nombre__istartswith=clean_m)
        )
        qs = Comision.objects.filter(m_filter)
        if car:
            qs = qs.filter(plan_materia__carrera=car)
        com = qs.filter(nombre__iexact=c_clean).first()
        if com:
            return com
        if qs.count() == 1:
            return qs.first()
        return None

    # 6. Horarios
    for p in [x for x in all_csvs if "horario" in x.name.lower()]:
        for row in get_rows(p):
            c_str = row.get("carrera", "").strip()
            m_str = row.get("materia", "").strip()
            com_nom = (
                row.get("comision_nombre")
                or row.get("nombre_comision")
                or row.get("comision")
                or row.get("Curso")
                or row.get("curso")
                or ""
            ).strip()
            plan_estudio = row.get("plan_estudio", "").strip() or None
            espacio_str = (row.get("espacio") or row.get("aula") or "").strip()
            dia_str = (row.get("dia_semana") or row.get("dia") or "").strip()
            hora_inicio = (row.get("hora_inicio") or "").strip()
            hora_fin = (row.get("hora_fin") or "").strip()
            activo_str = (row.get("activo") or "true").strip().lower()
            activo = activo_str in ["true", "1", "si", "sí", "t"]

            if not c_str or not m_str or not com_nom or not dia_str:
                continue

            comision = buscar_comision(c_str, m_str, com_nom, plan_estudio)
            if not comision:
                continue

            espacio = None
            if espacio_str:
                espacio = (
                    Espacio.objects.filter(nombre__iexact=espacio_str).first()
                    or Espacio.objects.filter(nombre__icontains=espacio_str).first()
                )

            dia_norm = normalizar_dia(dia_str)
            if not dia_norm:
                continue

            HorarioCursado.objects.update_or_create(
                comision=comision,
                espacio=espacio,
                dia_semana=dia_norm,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
                defaults={"activo": activo},
            )


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0026_alter_planmateria_plan_estudio"),
    ]

    operations = [
        migrations.RunPython(cargar_seeds, migrations.RunPython.noop),
    ]
