from django.db import migrations


def crear_grupos(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    grupos_permisos = {
        'admin': Permission.objects.all(),
        'secretaria': Permission.objects.filter(
            content_type__app_label='api',
            codename__in=[
                'add_carrera', 'change_carrera', 'delete_carrera', 'view_carrera',
                'add_materia', 'change_materia', 'delete_materia', 'view_materia',
                'add_carreramateria', 'change_carreramateria', 'delete_carreramateria', 'view_carreramateria',
                'add_horariocursado', 'change_horariocursado', 'delete_horariocursado', 'view_horariocursado',
                'add_mesaexamen', 'change_mesaexamen', 'delete_mesaexamen', 'view_mesaexamen',
                'add_noticias', 'change_noticias', 'delete_noticias', 'view_noticias',
                'add_actividadextra', 'change_actividadextra', 'delete_actividadextra', 'view_actividadextra',
                'add_suspension', 'change_suspension', 'delete_suspension', 'view_suspension',
            ],
        ),
        'totem': Permission.objects.filter(
            content_type__app_label='api',
            codename__startswith='view_',
        ),
    }

    for nombre, permisos in grupos_permisos.items():
        grupo, _ = Group.objects.get_or_create(name=nombre)
        grupo.permissions.set(permisos)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(crear_grupos),
    ]
