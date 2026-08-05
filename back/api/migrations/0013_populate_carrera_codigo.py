from django.db import migrations


CODIGOS = {
    'Ingenieria en Sistemas de Informacion': 'ISI',
    'Ingenieria Electromecanica': 'IEM',
    'Ingenieria Quimica': 'IQ',
    'Licenciatura en Administracion Rural': 'LAR',
    'Tecnicatura Universitaria en Programacion': 'TUP',
    'Tecnicatura Universitaria en Logistica': 'TUL',
    'Tecnicatura Universitaria en Mecatronica': 'TUM',
    'Tecnicatura Universitaria en Programacion a Distancia': 'TUPD',
    'Tecnicatura Universitaria en Operaciones y Mantenimiento de Redes Electricas': 'TUOMRE',
    'Diplomatura en Tecnologias Inclusivas en Educacion': 'DTIE',
    'Doctorado en Informatica': 'DI',
    'Especializacion en Higiene y Seguridad en el Trabajo': 'EHST',
    'Especializacion en Ingenieria Gerencial': 'EIG',
}


def forwards(apps, schema_editor):
    Carrera = apps.get_model('api', 'Carrera')
    for carrera in Carrera.objects.filter(codigo__isnull=True):
        codigo = CODIGOS.get(carrera.nombre)
        if codigo:
            carrera.codigo = codigo
            carrera.save(update_fields=['codigo'])


def backwards(apps, schema_editor):
    Carrera = apps.get_model('api', 'Carrera')
    Carrera.objects.all().update(codigo=None)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_carrera_codigo'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
