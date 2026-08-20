from django.core.exceptions import ValidationError
from django.db import models


class Espacio(models.Model):
    TIPO_ESPACIO = [
        ('aula', 'Aula'),
        ('laboratorio_informatico', 'Laboratorio Informático'),
        ('secretaria', 'Secretaría'),
        ('departamento', 'Departamento'),
        ('otro', 'Otro'),
    ]

    PISO = [
        ('planta_baja', 'Planta Baja'),
        ('primer_piso', 'Primer Piso'),
        ('segundo_piso', 'Segundo Piso'),
    ]

    nombre = models.CharField(max_length=150, unique=True)
    tipo = models.CharField(max_length=50, choices=TIPO_ESPACIO)
    tipo_otro = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Completar solo si el tipo es "Otro".',
    )
    piso = models.CharField(max_length=20, choices=PISO, default='planta_baja')

    class Meta:
        ordering = ['piso', 'nombre']
        verbose_name = 'Espacio'
        verbose_name_plural = 'Espacios'

    def __str__(self):
        return self.nombre

    def clean(self):
        if self.tipo == 'otro' and not self.tipo_otro:
            raise ValidationError(
                {'tipo_otro': 'Debe especificar el tipo de espacio cuando selecciona "Otro".'}
            )
        if self.tipo != 'otro' and self.tipo_otro:
            raise ValidationError(
                {'tipo_otro': 'Este campo solo se completa cuando el tipo es "Otro".'}
            )


class UbicacionMapa(models.Model):
    """Representa una ubicación (polígono) dentro del SVG del mapa interactivo del tótem."""

    TIPO_CHOICES = [
        ('aula', 'Aula'),
        ('oficina', 'Oficina'),
        ('departamento', 'Departamento'),
        ('secretaria', 'Secretaría'),
        ('laboratorio', 'Laboratorio'),
        ('servicio', 'Servicio'),
        ('escaleras', 'Escaleras'),
        ('ascensor', 'Ascensor'),
        ('baños', 'Baños'),
        ('otro', 'Otro'),
    ]

    PISO_CHOICES = [
        ('baja', 'Planta Baja'),
        ('primero', 'Primer Piso'),
        ('segundo', 'Segundo Piso'),
    ]

    svg_id = models.CharField(
        max_length=50,
        help_text='Identificador del polígono en el SVG (ej: "1", "escaleras1", "baño2").',
    )
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='otro')
    piso = models.CharField(max_length=10, choices=PISO_CHOICES)

    class Meta:
        ordering = ['piso', 'svg_id']
        unique_together = [('svg_id', 'piso')]
        verbose_name = 'Ubicación en Mapa'
        verbose_name_plural = 'Ubicaciones en Mapa'

    def __str__(self):
        return f'{self.nombre} ({self.svg_id} — {self.get_piso_display()})'

