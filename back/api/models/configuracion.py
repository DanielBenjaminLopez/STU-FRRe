import random

from django.db import models
from django.utils import timezone


class Totem(models.Model):
    VINCULO_VIGENCIA_HORAS = 1

    nombre = models.CharField(max_length=150, blank=True, default='')
    espacio = models.ForeignKey(
        'Espacio',
        on_delete=models.PROTECT,
        related_name='totems',
        null=True,
        blank=True,
    )
    codigo_vinculacion = models.CharField(
        max_length=10, unique=True, null=True, blank=True
    )
    vinculado = models.BooleanField(default=False)
    plantilla = models.ForeignKey(
        'Plantilla',
        on_delete=models.SET_NULL,
        related_name='totems',
        null=True,
        blank=True,
    )
    config_pantalla = models.JSONField(default=dict)
    creado_en = models.DateTimeField(auto_now_add=True)
    codigo_creado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Tótem'
        verbose_name_plural = 'Tótems'

    def __str__(self):
        return self.nombre or self.codigo_vinculacion or f'Tótem #{self.id}'

    @classmethod
    def generar_codigo(cls) -> str:
        while True:
            codigo = f'{random.randint(0, 99999):05d}'
            if not cls.objects.filter(codigo_vinculacion=codigo).exists():
                return codigo

    @property
    def codigo_valido(self) -> bool:
        if not self.codigo_creado_en or not self.codigo_vinculacion:
            return False
        if self.vinculado:
            return False
        vigencia = timezone.now() - self.codigo_creado_en
        return vigencia.total_seconds() < self.VINCULO_VIGENCIA_HORAS * 3600


class Widget(models.Model):
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código identificador único (ej: 'horarios', 'examenes')",
    )
    col_tam_default = models.PositiveIntegerField(
        default=4,
        help_text="Cantidad de columnas por defecto (ancho)",
    )
    fila_tam_default = models.PositiveIntegerField(
        default=2,
        help_text="Cantidad de filas por defecto (alto)",
    )
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Widget'
        verbose_name_plural = 'Widgets'

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"


class Plantilla(models.Model):
    nombre = models.CharField(max_length=150)
    activa = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Plantilla'
        verbose_name_plural = 'Plantillas'

    def __str__(self):
        return self.nombre


class PlantillaWidget(models.Model):
    plantilla = models.ForeignKey(
        Plantilla,
        on_delete=models.CASCADE,
        related_name='widgets_posiciones',
    )
    widget = models.ForeignKey(
        Widget,
        on_delete=models.CASCADE,
        related_name='plantillas_posiciones',
    )
    col_pos = models.PositiveIntegerField(
        help_text="Ubicación de la columna en la grilla (X, ej: 0, 1, 2, 3)",
    )
    fila_pos = models.PositiveIntegerField(
        help_text="Ubicación de la fila en la grilla (Y, ej: 0, 1...)",
    )
    col_tam = models.PositiveIntegerField(
        default=4,
        help_text="Cantidad de columnas que abarca (ancho)",
    )
    fila_tam = models.PositiveIntegerField(
        default=2,
        help_text="Cantidad de filas que abarca (alto)",
    )

    class Meta:
        ordering = ['plantilla', 'fila_pos', 'col_pos']
        verbose_name = 'Widget en Plantilla'
        verbose_name_plural = 'Widgets en Plantillas'

    def __str__(self):
        return f"{self.widget.nombre} en {self.plantilla.nombre} ({self.col_pos}, {self.fila_pos})"



