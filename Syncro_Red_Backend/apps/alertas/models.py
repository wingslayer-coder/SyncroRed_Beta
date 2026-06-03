from django.db import models
from apps.usuarios.models import Usuario


class Emergencia(models.Model):
    ESTADO_CHOICES = [
        ('ACTIVA', 'Activa'),
        ('CONTROLADA', 'Controlada'),
        ('CERRADA', 'Cerrada'),
    ]

    fecha_hora = models.DateTimeField(auto_now_add=True)
    tren_num = models.CharField(max_length=20, blank=True)
    equipo = models.CharField(max_length=20, blank=True)
    maquinista = models.CharField(max_length=100, blank=True)
    ayudante = models.CharField(max_length=100, blank=True)
    estado_tripulacion = models.CharField(max_length=50, blank=True)
    tipo_evento = models.CharField(max_length=100, blank=True)
    ubicacion = models.TextField(blank=True)
    rut_reporta = models.CharField(max_length=20, blank=True)
    nombre_reporta = models.CharField(max_length=100, blank=True)
    estado_alerta = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVA')
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'emergencias_activas'

    def __str__(self):
        return f"Emergencia {self.tipo_evento} - Tren {self.tren_num}"


class Incidencia(models.Model):
    ESTADO_CHOICES = [
        ('REGISTRADA', 'Registrada'),
        ('EN GESTION', 'En gestión'),
        ('RESUELTA', 'Resuelta'),
    ]

    fecha_hora = models.DateTimeField(auto_now_add=True)
    fecha = models.DateField()
    tren_num = models.CharField(max_length=20, blank=True)
    equipo = models.CharField(max_length=20, blank=True)
    maquinista = models.CharField(max_length=100, blank=True)
    ayudante = models.CharField(max_length=100, blank=True)
    rut_reporta = models.CharField(max_length=20, blank=True)
    nombre_reporta = models.CharField(max_length=100, blank=True)
    tipo_incidencia = models.CharField(max_length=100)
    detalle = models.TextField(blank=True)
    ubicacion = models.TextField(blank=True)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='REGISTRADA')

    class Meta:
        db_table = 'incidencias_ferroviarias'

    def __str__(self):
        return f"{self.tipo_incidencia} - Tren {self.tren_num}"


class FallaEquipo(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('GESTIONADA', 'Gestionada'),
        ('CERRADA', 'Cerrada'),
    ]

    fecha_hora = models.DateTimeField(auto_now_add=True)
    tren_num = models.CharField(max_length=20, blank=True)
    equipo = models.CharField(max_length=20, blank=True)
    rut_reporta = models.CharField(max_length=20, blank=True)
    nombre_reporta = models.CharField(max_length=100, blank=True)
    sistema_afectado = models.CharField(max_length=100, blank=True)
    detalle = models.TextField(blank=True)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')

    class Meta:
        db_table = 'fallas_equipos'

    def __str__(self):
        return f"{self.sistema_afectado} - Tren {self.tren_num}"
