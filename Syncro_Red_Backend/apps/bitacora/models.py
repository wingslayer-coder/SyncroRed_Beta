from django.db import models
from apps.usuarios.models import Usuario


class ReporteFinal(models.Model):
    fecha = models.DateField()
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='reportes_finales', to_field='rut', db_column='usuario')
    cargo = models.CharField(max_length=50, blank=True)
    resumen_texto = models.TextField(blank=True)
    reporte_texto = models.TextField(blank=True)
    justificacion_cierre = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reportes_finales'

    def __str__(self):
        return f"Reporte {self.usuario} - {self.fecha}"


class NovedadOperativa(models.Model):
    CATEGORIA_ATRASO_CHOICES = [
        ('LEVE', 'Leve'),
        ('MODERADO', 'Moderado'),
        ('GRAVE', 'Grave'),
    ]

    reporte = models.ForeignKey(ReporteFinal, on_delete=models.CASCADE, related_name='novedades', db_column='reporte_id')
    fecha = models.DateField()
    tren_num = models.CharField(max_length=20, blank=True)
    equipo_id = models.CharField(max_length=20, blank=True)
    estacion = models.CharField(max_length=100, blank=True)
    tipo = models.CharField(max_length=50, blank=True)
    minutos = models.IntegerField(default=0)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_ATRASO_CHOICES, blank=True)
    detalle = models.TextField(blank=True)
    hora_programada = models.CharField(max_length=10, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'novedades_operativas'

    def __str__(self):
        return f"Novedad {self.tren_num} - {self.estacion}"
