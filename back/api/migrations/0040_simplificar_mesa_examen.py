import django.db.models.deletion
from django.db import migrations, models


def migrar_mesas_examen(apps, schema_editor):
    MesaExamen = apps.get_model("api", "MesaExamen")
    seen = set()
    for m in MesaExamen.objects.select_related("materia_fk").all().order_by("id"):
        carrera_id = m.materia_fk.carrera_id if m.materia_fk_id else None
        materia_str = m.materia_fk.nombre if m.materia_fk_id else ""
        key = (carrera_id, materia_str, m.espacio, m.fecha, m.hora)
        if key in seen:
            m.delete()
        else:
            seen.add(key)
            m.carrera_id = carrera_id
            m.materia = materia_str
            m.save(update_fields=["carrera_id", "materia"])


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0039_actualizar_seed_academico"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="horariocursado",
            options={
                "ordering": ["materia", "comision", "dia_semana", "hora_inicio", "id"],
                "verbose_name": "Horario de cursado",
                "verbose_name_plural": "Horarios de cursado",
            },
        ),
        migrations.AlterUniqueTogether(
            name="mesaexamen",
            unique_together=set(),
        ),
        migrations.RenameField(
            model_name="mesaexamen",
            old_name="materia",
            new_name="materia_fk",
        ),
        migrations.AddField(
            model_name="mesaexamen",
            name="carrera",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="mesas_examen",
                to="api.carrera",
            ),
        ),
        migrations.AddField(
            model_name="mesaexamen",
            name="materia",
            field=models.CharField(
                default="",
                help_text="Nombre de la materia",
                max_length=200,
            ),
        ),
        migrations.RunPython(migrar_mesas_examen, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="mesaexamen",
            name="materia_fk",
        ),
        migrations.RemoveField(
            model_name="mesaexamen",
            name="activo",
        ),
        migrations.RemoveField(
            model_name="mesaexamen",
            name="turno",
        ),
        migrations.AlterUniqueTogether(
            name="mesaexamen",
            unique_together={("carrera", "materia", "espacio", "fecha", "hora")},
        ),
    ]
