from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from .models import (
    Aviso,
    Carrera,
    Comision,
    Espacio,
    Evento,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    PlanMateria,
    Totem,
)
from .resources import (
    AvisoResource,
    CarreraResource,
    ComisionResource,
    EspacioResource,
    EventoResource,
    HorarioCursadoResource,
    MateriaResource,
    MesaExamenResource,
    NoticiasResource,
    PlanMateriaResource,
    TotemResource,
)


@admin.register(Totem)
class TotemAdmin(ImportExportModelAdmin):
    resource_class = TotemResource
    list_display = ['nombre', 'espacio', 'creado_en']
    search_fields = ['nombre']


@admin.register(Espacio)
class EspacioAdmin(ImportExportModelAdmin):
    resource_class = EspacioResource
    list_display = ['nombre', 'tipo', 'piso']
    list_filter = ['tipo', 'piso']
    search_fields = ['nombre']


@admin.register(Carrera)
class CarreraAdmin(ImportExportModelAdmin):
    resource_class = CarreraResource
    list_display = ['nombre']
    search_fields = ['nombre']


@admin.register(Materia)
class MateriaAdmin(ImportExportModelAdmin):
    resource_class = MateriaResource
    list_display = ['nombre']
    search_fields = ['nombre']


@admin.register(PlanMateria)
class PlanMateriaAdmin(ImportExportModelAdmin):
    resource_class = PlanMateriaResource
    list_display = [
        'carrera',
        'materia',
        'nivel',
        'modalidad',
        'cuatrimestre',
        'plan_estudio',
    ]
    list_filter = ['carrera', 'nivel', 'modalidad', 'plan_estudio']


@admin.register(Comision)
class ComisionAdmin(ImportExportModelAdmin):
    resource_class = ComisionResource
    list_display = ['nombre', 'plan_materia']
    list_filter = ['plan_materia__carrera']
    search_fields = ['nombre', 'plan_materia__materia__nombre']


@admin.register(HorarioCursado)
class HorarioCursadoAdmin(ImportExportModelAdmin):
    resource_class = HorarioCursadoResource
    list_display = [
        'comision',
        'espacio',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'activo',
    ]
    list_filter = ['dia_semana', 'activo']
    search_fields = [
        'comision__nombre',
        'comision__plan_materia__materia__nombre',
    ]


@admin.register(MesaExamen)
class MesaExamenAdmin(ImportExportModelAdmin):
    resource_class = MesaExamenResource
    list_display = [
        'plan_materia',
        'espacio',
        'fecha',
        'hora',
        'turno',
        'activo',
    ]
    list_filter = ['turno', 'activo', 'plan_materia__carrera']
    search_fields = ['plan_materia__materia__nombre']


@admin.register(Evento)
class EventoAdmin(ImportExportModelAdmin):
    resource_class = EventoResource
    list_display = [
        'titulo',
        'tipo',
        'fecha_hora_inicio',
        'fecha_hora_fin',
        'espacio',
    ]
    list_filter = ['tipo']
    search_fields = ['titulo']


@admin.register(Aviso)
class AvisoAdmin(ImportExportModelAdmin):
    resource_class = AvisoResource
    list_display = ['horario_cursado', 'evento', 'fecha', 'motivo', 'tipo']
    list_filter = ['tipo']
    search_fields = ['motivo']


@admin.register(Noticias)
class NoticiasAdmin(ImportExportModelAdmin):
    resource_class = NoticiasResource
    list_display = ['titulo', 'fecha_publicacion', 'fecha_expiracion']
    search_fields = ['titulo', 'contenido']
