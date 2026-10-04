import django.db.models.deletion
from django.db import migrations, models


def migrar_datos_academicos(apps, schema_editor):
    Materia = apps.get_model("api", "Materia")
    PlanMateria = apps.get_model("api", "PlanMateria")
    HorarioCursado = apps.get_model("api", "HorarioCursado")
    MesaExamen = apps.get_model("api", "MesaExamen")

    pm_to_materia = {}

    for pm in PlanMateria.objects.select_related("materia").all():
        mat_nombre = pm.materia.nombre
        existing = Materia.objects.filter(
            carrera_id=pm.carrera_id,
            nombre=mat_nombre,
            nivel=pm.nivel,
        ).first()
        if existing:
            pm_to_materia[pm.id] = existing.id
            continue

        base_mat = Materia.objects.filter(id=pm.materia_id).first()
        if base_mat and base_mat.carrera_id is None:
            base_mat.carrera_id = pm.carrera_id
            base_mat.nivel = pm.nivel
            base_mat.save(update_fields=["carrera_id", "nivel"])
            pm_to_materia[pm.id] = base_mat.id
        else:
            new_mat = Materia.objects.create(
                nombre=mat_nombre,
                carrera_id=pm.carrera_id,
                nivel=pm.nivel,
            )
            pm_to_materia[pm.id] = new_mat.id

    seen_horarios = set()
    for h in HorarioCursado.objects.select_related("comision_fk", "espacio_fk").all():
        if h.comision_fk_id:
            mat_id = pm_to_materia.get(h.comision_fk.plan_materia_id)
            com_str = h.comision_fk.nombre or ""
            esp_str = h.espacio_fk.nombre if h.espacio_fk_id else ""
            key = (mat_id, com_str, esp_str, h.dia_semana, h.hora_inicio, h.hora_fin)
            if key in seen_horarios:
                h.delete()
            else:
                seen_horarios.add(key)
                h.materia_id = mat_id
                h.comision = com_str
                h.espacio = esp_str
                h.save(update_fields=["materia_id", "comision", "espacio"])

    seen_mesas = set()
    for m in MesaExamen.objects.select_related("espacio_fk").all():
        if m.plan_materia_id:
            mat_id = pm_to_materia.get(m.plan_materia_id)
            esp_str = m.espacio_fk.nombre if m.espacio_fk_id else ""
            key = (mat_id, esp_str, m.fecha, m.hora, m.turno)
            if key in seen_mesas:
                m.delete()
            else:
                seen_mesas.add(key)
                m.materia_id = mat_id
                m.espacio = esp_str
                m.save(update_fields=["materia_id", "espacio"])


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0037_merge_20261002_0455"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="horariocursado",
            unique_together=set(),
        ),
        migrations.AlterUniqueTogether(
            name="mesaexamen",
            unique_together=set(),
        ),
        migrations.AlterField(
            model_name="materia",
            name="nombre",
            field=models.CharField(max_length=200),
        ),
        migrations.AddField(
            model_name="materia",
            name="carrera",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="materias",
                to="api.carrera",
            ),
        ),
        migrations.AddField(
            model_name="materia",
            name="nivel",
            field=models.CharField(
                choices=[
                    ("primero", "Primer año"),
                    ("segundo", "Segundo año"),
                    ("tercero", "Tercer año"),
                    ("cuarto", "Cuarto año"),
                    ("quinto", "Quinto año"),
                ],
                default="primero",
                max_length=10,
            ),
        ),
        migrations.RenameField(
            model_name="horariocursado",
            old_name="comision",
            new_name="comision_fk",
        ),
        migrations.RenameField(
            model_name="horariocursado",
            old_name="espacio",
            new_name="espacio_fk",
        ),
        migrations.AddField(
            model_name="horariocursado",
            name="materia",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="horarios",
                to="api.materia",
            ),
        ),
        migrations.AddField(
            model_name="horariocursado",
            name="comision",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Ej: K1, K2, Curso 1, Única",
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="horariocursado",
            name="espacio",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Ej: Aula 10, Laboratorio 4",
                max_length=150,
            ),
        ),
        migrations.RemoveField(
            model_name="horariocursado",
            name="activo",
        ),
        migrations.RenameField(
            model_name="mesaexamen",
            old_name="espacio",
            new_name="espacio_fk",
        ),
        migrations.AddField(
            model_name="mesaexamen",
            name="materia",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="mesas_examen",
                to="api.materia",
            ),
        ),
        migrations.AddField(
            model_name="mesaexamen",
            name="espacio",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Ej: Aula 10, Aula Magna",
                max_length=150,
            ),
        ),
        migrations.RunPython(migrar_datos_academicos, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="horariocursado",
            name="comision_fk",
        ),
        migrations.RemoveField(
            model_name="horariocursado",
            name="espacio_fk",
        ),
        migrations.RemoveField(
            model_name="mesaexamen",
            name="plan_materia",
        ),
        migrations.RemoveField(
            model_name="mesaexamen",
            name="espacio_fk",
        ),
        migrations.RemoveField(
            model_name="totem",
            name="espacio",
        ),
        migrations.DeleteModel(
            name="Comision",
        ),
        migrations.DeleteModel(
            name="PlanMateria",
        ),
        migrations.DeleteModel(
            name="Espacio",
        ),
        migrations.AlterModelOptions(
            name="materia",
            options={
                "ordering": ["carrera", "nivel", "nombre"],
                "verbose_name": "Materia",
                "verbose_name_plural": "Materias",
            },
        ),
        migrations.AlterUniqueTogether(
            name="materia",
            unique_together={("carrera", "nombre", "nivel")},
        ),
        migrations.AlterModelOptions(
            name="horariocursado",
            options={
                "ordering": ["materia", "comision", "dia_semana", "hora_inicio"],
                "verbose_name": "Horario de cursado",
                "verbose_name_plural": "Horarios de cursado",
            },
        ),
        migrations.AlterUniqueTogether(
            name="horariocursado",
            unique_together={
                ("materia", "comision", "espacio", "dia_semana", "hora_inicio", "hora_fin")
            },
        ),
        migrations.AlterUniqueTogether(
            name="mesaexamen",
            unique_together={("materia", "espacio", "fecha", "hora", "turno")},
        ),
    ]
