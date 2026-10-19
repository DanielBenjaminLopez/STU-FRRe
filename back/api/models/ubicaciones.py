import json
from pathlib import Path

from django.core.exceptions import ValidationError
from django.db import models

MAPA_POLYGON_MANIFEST = Path(__file__).resolve().parents[1] / "mapa_polygon_ids.json"


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

    def clean(self):
        super().clean()
        if not MAPA_POLYGON_MANIFEST.exists():
            return
        manifest = json.loads(MAPA_POLYGON_MANIFEST.read_text(encoding='utf-8'))
        valid_ids = manifest.get(self.piso)
        if valid_ids is not None and self.svg_id not in valid_ids:
            raise ValidationError(
                {
                    'svg_id': (
                        f'El polígono "{self.svg_id}" no existe en el SVG '
                        f'del piso "{self.piso}".'
                    )
                }
            )

    def __str__(self):
        return f'{self.nombre} ({self.svg_id} — {self.get_piso_display()})'


