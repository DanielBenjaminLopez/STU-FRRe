from django.db import models


class Espacio(models.Model):
    TIPO_ESPACIO = [
        ('aula', 'Aula'),
        ('laboratorio', 'Laboratorio'),
        ('oficina', 'Oficina'),
        ('departamento', 'Departamento'),
    ]

    nombre = models.CharField(max_length=150, unique=True)
    tipo = models.CharField(max_length=50, choices=TIPO_ESPACIO)
    piso = models.SmallIntegerField()
    capacidad = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['piso', 'nombre']
        verbose_name = 'Espacio'
        verbose_name_plural = 'Espacios'

    def __str__(self):
        return self.nombre
