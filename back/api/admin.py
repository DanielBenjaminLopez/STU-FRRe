from django.contrib import admin

from .models import (
    Totem,
    Espacio,
    Carrera,
    Materia,
    CarreraMateria,
    HorarioCursado,
    MesaExamen,
    ActividadExtra,
    Suspension,
    Noticias,
)


@admin.register(Totem)
class TotemAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'espacio', 'activo', 'creado_en']
    list_filter = ['activo']
    search_fields = ['nombre']


@admin.register(Espacio)
class EspacioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'piso', 'capacidad']
    list_filter = ['tipo', 'piso']
    search_fields = ['nombre']


@admin.register(Carrera)
class CarreraAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre']
    search_fields = ['codigo', 'nombre']


@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'profesores']
    search_fields = ['codigo', 'nombre']


@admin.register(CarreraMateria)
class CarreraMateriaAdmin(admin.ModelAdmin):
    list_display = ['carrera', 'materia', 'anio_plan', 'cuatrimestre']
    list_filter = ['carrera', 'anio_plan']


@admin.register(HorarioCursado)
class HorarioCursadoAdmin(admin.ModelAdmin):
    list_display = [
        'materia', 'espacio', 'dia_semana', 'comision',
        'hora_inicio', 'hora_fin', 'activo',
    ]
    list_filter = ['dia_semana', 'activo']
    search_fields = ['materia__nombre', 'comision']


@admin.register(MesaExamen)
class MesaExamenAdmin(admin.ModelAdmin):
    list_display = ['materia', 'espacio', 'fecha_hora', 'turno', 'llamado', 'activo']
    list_filter = ['turno', 'activo']
    search_fields = ['materia__nombre']


@admin.register(ActividadExtra)
class ActividadExtraAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'tipo', 'fecha_hora_inicio', 'fecha_hora_fin', 'espacio']
    list_filter = ['tipo']
    search_fields = ['titulo']


@admin.register(Suspension)
class SuspensionAdmin(admin.ModelAdmin):
    list_display = ['horario_cursado', 'actividad_extra', 'fecha', 'motivo', 'tipo']
    list_filter = ['tipo']
    search_fields = ['motivo']


@admin.register(Noticias)
class NoticiasAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'fecha_publicacion', 'fecha_expiracion']
    search_fields = ['titulo', 'contenido']
