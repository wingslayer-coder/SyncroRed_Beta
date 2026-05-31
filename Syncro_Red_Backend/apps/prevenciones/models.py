from django.db import models


class Prevencion(models.Model):
    SECCION_CHOICES = [
        ('faena_inicio', 'Notificación de faenas en inicio'),
        ('cortada', 'Programación de cortadas'),
    ]

    fecha_emision = models.DateField()
    tramo_desde = models.CharField(max_length=100, blank=True)
    tramo_hasta = models.CharField(max_length=100, blank=True)
    via = models.CharField(max_length=20, blank=True)
    pk_inicio = models.FloatField(null=True, blank=True)
    pk_termino = models.FloatField(null=True, blank=True)
    texto_original_km = models.TextField(blank=True)
    velocidad_restriccion = models.CharField(max_length=20, blank=True)
    causa = models.TextField(blank=True)
    hora_inicio = models.CharField(max_length=10, blank=True)
    hora_termino = models.CharField(max_length=10, blank=True)
    encargado = models.CharField(max_length=100, blank=True)
    seccion = models.CharField(max_length=30, choices=SECCION_CHOICES, default='faena_inicio')

    class Meta:
        db_table = 'prevenciones_activas'

    def __str__(self):
        return f"{self.tramo_desde} - {self.tramo_hasta} ({self.fecha_emision})"


class EstacionVia(models.Model):
    estacion = models.CharField(max_length=20)
    via = models.CharField(max_length=10)
    posicion = models.CharField(max_length=10, blank=True)
    etiqueta = models.CharField(max_length=50, blank=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        db_table = 'estaciones_vias'
        unique_together = ['estacion', 'via', 'posicion']

    def __str__(self):
        return self.etiqueta or f"{self.estacion} {self.via}"
