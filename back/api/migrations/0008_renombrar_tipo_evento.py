from django.db import migrations


def renombrar_tipo_evento(apps, schema_editor):
    Evento = apps.get_model('api', 'Evento')
    Evento.objects.filter(tipo='evento').update(tipo='recreativo')


def revertir(apps, schema_editor):
    Evento = apps.get_model('api', 'Evento')
    Evento.objects.filter(tipo='recreativo').update(tipo='evento')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_evento_imagen_url'),
    ]

    operations = [
        migrations.RunPython(renombrar_tipo_evento, revertir),
    ]
