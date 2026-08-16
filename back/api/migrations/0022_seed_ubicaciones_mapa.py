"""
Migración de datos: carga las ubicaciones del mapa SVG desde los JSON estáticos del frontend
hacia la tabla UbicacionMapa en la base de datos.

Los svg_id son los identificadores originales de cada polígono en el SVG.
Como el mismo id (ej: "ascensor1", "escaleras1") puede aparecer en varios pisos,
la unicidad se garantiza con el constraint (svg_id, piso) definido en el modelo.
"""
from django.db import migrations


PLANTA_BAJA = {
    "1":          {"nombre": "Decanato"},
    "2":          {"nombre": "Vicedecanato"},
    "3":          {"nombre": "Sala de Consejo Directivo"},
    "4":          {"nombre": "Secretaría de Ciencia y Tecnología",    "tipo": "secretaria"},
    "5":          {"nombre": "Dirección de TICs"},
    "6":          {"nombre": "Gestión Tecnológica"},
    "7":          {"nombre": "CinApTIC",                              "tipo": "laboratorio"},
    "8":          {"nombre": "Departamento de Materias Básicas",      "tipo": "departamento"},
    "9":          {"nombre": "Kiosco",                                "tipo": "servicio"},
    "10":         {"nombre": "Secretaría de Asuntos Universitarios",  "tipo": "secretaria"},
    "11":         {"nombre": "UCES"},
    "12":         {"nombre": "Alumnado"},
    "13":         {"nombre": "Secretaría Académica",                  "tipo": "secretaria"},
    "14":         {"nombre": "Bedelía"},
    "15":         {"nombre": "Despacho"},
    "16":         {"nombre": "Secretaría de Infraestructura",         "tipo": "secretaria"},
    "17":         {"nombre": "Secretaría de Extensión Universitaria", "tipo": "secretaria"},
    "18":         {"nombre": "Informes"},
    "19":         {"nombre": "Campus Virtual"},
    "20":         {"nombre": "Radio Universidad"},
    "21":         {"nombre": "Seminario Universitario"},
    "22":         {"nombre": "Planeamiento Académico"},
    "23":         {"nombre": "Dirección de Personal"},
    "24":         {"nombre": "Datusen"},
    "25":         {"nombre": "Secretaría Administrativa / Tesorería", "tipo": "secretaria"},
    "26":         {"nombre": "Mantenimiento",                         "tipo": "servicio"},
    "27":         {"nombre": "CinApTIC",                              "tipo": "laboratorio"},
    "28":         {"nombre": "Dpto. I.Q.",                            "tipo": "departamento"},
    "29":         {"nombre": "Dpto. L.A.R.",                          "tipo": "departamento"},
    "30":         {"nombre": "Dpto. I.E.M.",                          "tipo": "departamento"},
    "31":         {"nombre": "Dpto. I.S.I.",                          "tipo": "departamento"},
    "32":         {"nombre": "Biblioteca",                            "tipo": "servicio"},
    "33":         {"nombre": "Oficina de Archivos"},
    "34":         {"nombre": "Sala de Profesores"},
    "35":         {"nombre": "Playon deportivo",                      "tipo": "servicio"},
    "36":         {"nombre": "Sin nombre",                            "tipo": "otro"},
    "37":         {"nombre": "Sin nombre",                            "tipo": "otro"},
    "38":         {"nombre": "Sin nombre",                            "tipo": "otro"},
    "escaleras1": {"nombre": "Escalera Entrada a Primer Piso",        "tipo": "escaleras"},
    "escaleras2": {"nombre": "Escalera Pasillo a Primer Piso",        "tipo": "escaleras"},
    "escaleras4": {"nombre": "Escalera a Terraza",                    "tipo": "escaleras"},
    "baño1":      {"nombre": "Baño Hombres",                          "tipo": "baños"},
    "baño2":      {"nombre": "Baño Mujeres",                          "tipo": "baños"},
    "ascensor1":  {"nombre": "Ascensor",                              "tipo": "ascensor"},
}

PRIMER_PISO = {
    "36":         {"nombre": "Aula 1.3",                              "tipo": "aula"},
    "37":         {"nombre": "G.I.E.S.IN",                            "tipo": "laboratorio"},
    "38":         {"nombre": "G.I.Me.F. / G.I.LLAR",                 "tipo": "laboratorio"},
    "39":         {"nombre": "Laboratorio de Radiosimetría",          "tipo": "laboratorio"},
    "40":         {"nombre": "Centro de Estudiantes (CET)"},
    "41":         {"nombre": "Aula Informática 5",                    "tipo": "aula"},
    "42":         {"nombre": "Aula Informática 6",                    "tipo": "aula"},
    "43":         {"nombre": "Aula 1.2",                              "tipo": "aula"},
    "44":         {"nombre": "Aula 1.1",                              "tipo": "aula"},
    "45":         {"nombre": "GISTAQ",                                "tipo": "laboratorio"},
    "46":         {"nombre": "Coordinación TUP y LTE"},
    "47":         {"nombre": "Aula 1.4",                              "tipo": "aula"},
    "48":         {"nombre": "Aula 1.5",                              "tipo": "aula"},
    "49":         {"nombre": "Aula 1.6",                              "tipo": "aula"},
    "50":         {"nombre": "Aula Informática 1",                    "tipo": "aula"},
    "51":         {"nombre": "Dirección de Posgrado"},
    "52":         {"nombre": "Aula Informática 2",                    "tipo": "aula"},
    "53":         {"nombre": "Espacio Progresar",                     "tipo": "aula"},
    "54":         {"nombre": "Aula Informática 4",                    "tipo": "aula"},
    "55":         {"nombre": "Aula Informática 3",                    "tipo": "aula"},
    "56":         {"nombre": "Aula Magna",                            "tipo": "aula"},
    "ascensor1":  {"nombre": "Ascensor",                              "tipo": "ascensor"},
    "escaleras1": {"nombre": "Escalera Entrada a Planta Baja",        "tipo": "escaleras"},
    "escaleras2": {"nombre": "Escalera Pasillo a Planta Baja",        "tipo": "escaleras"},
    "escaleras3": {"nombre": "Escalera Pasillo a Segundo Piso",       "tipo": "escaleras"},
    "escaleras4": {"nombre": "Escalera Terraza a Planta Baja",        "tipo": "escaleras"},
    "baño3":      {"nombre": "Baño Hombres",                          "tipo": "baños"},
}

SEGUNDO_PISO = {
    "57":         {"nombre": "Aula 2.1",                              "tipo": "aula"},
    "58":         {"nombre": "Aula 2.2",                              "tipo": "aula"},
    "59":         {"nombre": "Departamento de Obras y Proyectos",     "tipo": "departamento"},
    "60":         {"nombre": "Aula 2.3",                              "tipo": "aula"},
    "61":         {"nombre": "Aula 2.4",                              "tipo": "aula"},
    "62":         {"nombre": "Aula 2.5",                              "tipo": "aula"},
    "63":         {"nombre": "Aula 2.6",                              "tipo": "aula"},
    "64":         {"nombre": "Aula 2.9",                              "tipo": "aula"},
    "65":         {"nombre": "Aula 2.11",                             "tipo": "aula"},
    "66":         {"nombre": "Aula 2.10",                             "tipo": "aula"},
    "67":         {"nombre": "Aula 2.8",                              "tipo": "aula"},
    "68":         {"nombre": "Fotocopiadora",                         "tipo": "servicio"},
    "escaleras3": {"nombre": "Escalera Pasillo a Primer Piso",        "tipo": "escaleras"},
    "ascensor1":  {"nombre": "Ascensor",                              "tipo": "ascensor"},
    "baño4":      {"nombre": "Baño Mujeres",                          "tipo": "baños"},
}


def cargar_ubicaciones(apps, schema_editor):
    UbicacionMapa = apps.get_model('api', 'UbicacionMapa')

    registros = []

    for svg_id, datos in PLANTA_BAJA.items():
        registros.append(UbicacionMapa(
            svg_id=svg_id,
            nombre=datos["nombre"],
            tipo=datos.get("tipo", "oficina"),
            piso="baja",
        ))

    for svg_id, datos in PRIMER_PISO.items():
        registros.append(UbicacionMapa(
            svg_id=svg_id,
            nombre=datos["nombre"],
            tipo=datos.get("tipo", "oficina"),
            piso="primero",
        ))

    for svg_id, datos in SEGUNDO_PISO.items():
        registros.append(UbicacionMapa(
            svg_id=svg_id,
            nombre=datos["nombre"],
            tipo=datos.get("tipo", "oficina"),
            piso="segundo",
        ))

    UbicacionMapa.objects.bulk_create(registros)


def revertir_ubicaciones(apps, schema_editor):
    UbicacionMapa = apps.get_model('api', 'UbicacionMapa')
    UbicacionMapa.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0021_ubicacionmapa'),
    ]

    operations = [
        migrations.RunPython(cargar_ubicaciones, revertir_ubicaciones),
    ]
