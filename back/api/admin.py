from django.contrib import admin
from django.db import transaction
from import_export.admin import ImportExportModelAdmin

from .models import (
    Aviso,
    Carrera,
    Evento,
    EventoCalendario,
    HorarioCursado,
    Materia,
    MesaExamen,
    Noticias,
    Plantilla,
    PlantillaWidget,
    Totem,
    UbicacionMapa,
    Widget,
)
from .realtime import notify_content
from .resources import (
    AvisoResource,
    CarreraResource,
    EventoResource,
    EventoCalendarioResource,
    HorarioCursadoResource,
    MateriaResource,
    MesaExamenResource,
    NoticiasResource,
    TotemResource,
)


class RealtimeAdminMixin:
    content_resource = None

    def _notify(self):
        if self.content_resource:
            transaction.on_commit(lambda: notify_content(self.content_resource))

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        self._notify()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        self._notify()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        self._notify()

    def process_result(self, result, request):
        response = super().process_result(result, request)
        self._notify()
        return response


@admin.register(Widget)
class WidgetAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'col_tam_default', 'fila_tam_default', 'activo', 'creado_en']
    list_filter = ['activo']
    search_fields = ['nombre', 'tipo']


class PlantillaWidgetInline(admin.TabularInline):
    model = PlantillaWidget
    extra = 1


@admin.register(Plantilla)
class PlantillaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activa', 'creado_en']
    list_filter = ['activa']
    search_fields = ['nombre']
    inlines = [PlantillaWidgetInline]


@admin.register(PlantillaWidget)
class PlantillaWidgetAdmin(admin.ModelAdmin):
    list_display = ['plantilla', 'widget', 'col_pos', 'fila_pos', 'col_tam', 'fila_tam']
    list_filter = ['plantilla', 'widget']


@admin.register(Totem)
class TotemAdmin(ImportExportModelAdmin):
    resource_class = TotemResource
    list_display = ['nombre', 'plantilla', 'creado_en']
    search_fields = ['nombre']


@admin.register(UbicacionMapa)
class UbicacionMapaAdmin(admin.ModelAdmin):
    list_display = ['svg_id', 'nombre', 'tipo', 'piso']
    list_filter = ['piso', 'tipo']
    search_fields = ['nombre', 'svg_id']
    readonly_fields = ['svg_id', 'piso']


@admin.register(Carrera)
class CarreraAdmin(ImportExportModelAdmin):
    resource_class = CarreraResource
    list_display = ['codigo', 'nombre', 'tipo']
    search_fields = ['nombre', 'codigo']


@admin.register(Materia)
class MateriaAdmin(ImportExportModelAdmin):
    resource_class = MateriaResource
    list_display = ['nombre', 'carrera', 'nivel']
    list_filter = ['carrera', 'nivel']
    search_fields = ['nombre']


@admin.register(HorarioCursado)
class HorarioCursadoAdmin(RealtimeAdminMixin, ImportExportModelAdmin):
    content_resource = 'horarios'
    resource_class = HorarioCursadoResource
    list_display = [
        'materia',
        'comision',
        'espacio',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
    ]
    list_filter = ['dia_semana', 'materia__carrera']
    search_fields = [
        'comision',
        'materia__nombre',
    ]


@admin.register(MesaExamen)
class MesaExamenAdmin(RealtimeAdminMixin, ImportExportModelAdmin):
    content_resource = 'examenes'
    resource_class = MesaExamenResource
    list_display = [
        'carrera',
        'materia',
        'espacio',
        'fecha',
        'hora',
    ]
    list_filter = ['carrera']
    search_fields = ['materia', 'carrera__nombre', 'carrera__codigo']


@admin.register(Evento)
class EventoAdmin(RealtimeAdminMixin, ImportExportModelAdmin):
    content_resource = 'eventos'
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
class AvisoAdmin(RealtimeAdminMixin, ImportExportModelAdmin):
    content_resource = 'avisos'
    resource_class = AvisoResource
    list_display = ['horario_cursado', 'evento', 'fecha', 'motivo', 'tipo']
    list_filter = ['tipo']
    search_fields = ['motivo']


@admin.register(Noticias)
class NoticiasAdmin(RealtimeAdminMixin, ImportExportModelAdmin):
    content_resource = 'noticias'
    resource_class = NoticiasResource
    list_display = ['titulo', 'fecha_publicacion', 'fecha_expiracion']
    search_fields = ['titulo', 'contenido']


@admin.register(EventoCalendario)
class EventoCalendarioAdmin(RealtimeAdminMixin, ImportExportModelAdmin):
    content_resource = 'calendario'
    resource_class = EventoCalendarioResource
    list_display = ['titulo', 'tipo', 'fecha_inicio', 'fecha_fin', 'creado_en']
    list_filter = ['tipo']
    search_fields = ['titulo', 'descripcion']
