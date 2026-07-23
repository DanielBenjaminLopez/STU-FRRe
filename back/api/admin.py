from django.contrib import admin

from .models import (
    Totem,
    Espacio,
    Carrera,
    Materia,
    PlanMateria,
    Comision,
    HorarioCursado,
    MesaExamen,
    Evento,
    Aviso,
    Noticias,
)


@admin.register(Totem)
class TotemAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'espacio', 'creado_en']
    search_fields = ['nombre']


@admin.register(Espacio)
class EspacioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'piso']
    list_filter = ['tipo', 'piso']
    search_fields = ['nombre']


@admin.register(Carrera)
class CarreraAdmin(admin.ModelAdmin):
    list_display = ['nombre']
    search_fields = ['nombre']


@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ['nombre']
    search_fields = ['nombre']


@admin.register(PlanMateria)
class PlanMateriaAdmin(admin.ModelAdmin):
    list_display = ['carrera', 'materia', 'nivel', 'modalidad', 'cuatrimestre', 'plan_estudio']
    list_filter = ['carrera', 'nivel', 'modalidad', 'plan_estudio']


@admin.register(Comision)
class ComisionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'plan_materia']
    list_filter = ['plan_materia__carrera']
    search_fields = ['nombre', 'plan_materia__materia__nombre']


@admin.register(HorarioCursado)
class HorarioCursadoAdmin(admin.ModelAdmin):
    list_display = [
        'comision', 'espacio', 'dia_semana',
        'hora_inicio', 'hora_fin', 'activo',
    ]
    list_filter = ['dia_semana', 'activo']
    search_fields = ['comision__nombre', 'comision__plan_materia__materia__nombre']


@admin.register(MesaExamen)
class MesaExamenAdmin(admin.ModelAdmin):
    list_display = ['plan_materia', 'espacio', 'fecha', 'hora', 'turno', 'activo']
    list_filter = ['turno', 'activo', 'plan_materia__carrera']
    search_fields = ['plan_materia__materia__nombre']


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'fecha_hora_inicio', 'fecha_hora_fin', 'espacio']
    list_filter = ['tipo']
    search_fields = ['titulo']


@admin.register(Aviso)
class AvisoAdmin(admin.ModelAdmin):
    list_display = ['horario_cursado', 'evento', 'fecha', 'motivo', 'tipo']
    list_filter = ['tipo']
    search_fields = ['motivo']


@admin.register(Noticias)
class NoticiasAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'fecha_publicacion', 'fecha_expiracion']
    search_fields = ['titulo', 'contenido']
