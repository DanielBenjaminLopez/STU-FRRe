from django.db import migrations


def forwards(apps, schema_editor):
    Totem = apps.get_model('api', 'Totem')
    ConfiguracionVideo = apps.get_model('api', 'ConfiguracionVideo')

    try:
        config = ConfiguracionVideo.objects.get(pk=1)
    except ConfiguracionVideo.DoesNotExist:
        return

    if not config.video_archivo:
        return

    totems = Totem.objects.filter(vinculado=True)
    for totem in totems:
        totem.video_archivo = config.video_archivo
        totem.video_intervalo = config.intervalo
        totem.video_activo = config.activo
        totem.save(update_fields=['video_archivo', 'video_intervalo', 'video_activo'])


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0026_add_video_fields_to_totem'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
