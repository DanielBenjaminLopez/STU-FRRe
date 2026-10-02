from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0035_poblar_edificios_anexo'),
    ]

    operations = [
        migrations.AddField(
            model_name='totem',
            name='pin_mapa_orientacion',
            field=models.IntegerField(
                choices=[
                    (0, '0° (Norte / Estándar)'),
                    (90, '90° (Este / Derecha)'),
                    (180, '180° (Sur / Invertido)'),
                    (270, '270° (Oeste / Izquierda)'),
                ],
                default=0,
                help_text='Orientación fija del mapa en grados (0, 90, 180, 270).',
            ),
        ),
    ]
