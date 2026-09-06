from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_totem_pin_mapa'),
    ]

    operations = [
        migrations.AlterField(
            model_name='evento',
            name='imagen_url',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
