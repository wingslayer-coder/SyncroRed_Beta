from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    def create_user(self, rut, password=None, **extra_fields):
        if not rut:
            raise ValueError('El RUT es obligatorio')
        extra_fields.setdefault('is_active', True)
        user = self.model(rut=rut, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, rut, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(rut, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    CARGO_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('GERENTE', 'Gerente'),
        ('GERENCIA', 'Gerencia'),
        ('IL', 'Inspector de Línea'),
        ('INSPECTOR DE LINEA', 'Inspector de Línea'),
        ('SL', 'Supervisor de Línea'),
        ('SUPERVISOR DE LINEA', 'Supervisor de Línea'),
        ('JEFE DE OPERACIONES', 'Jefe de Operaciones'),
        ('JEFE SERVICIO', 'Jefe de Servicio'),
        ('JEFE DE SERVICIO', 'Jefe de Servicio'),
        ('MAQUINISTA', 'Maquinista'),
        ('AYUDANTE', 'Ayudante'),
    ]

    rut = models.CharField(max_length=20, primary_key=True, verbose_name='RUT')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100, blank=True)
    cargo = models.CharField(max_length=30, choices=CARGO_CHOICES, default='MAQUINISTA')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'rut'
    REQUIRED_FIELDS = ['nombre']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.nombre} ({self.rut})"


class RegistroOperativo(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('CONFIRMADO', 'Confirmado'),
        ('RECHAZADO', 'Rechazado'),
    ]

    fecha = models.DateField()
    rut_trabajador = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='registros_operativos', to_field='rut', db_column='rut_trabajador')
    lugar_apertura = models.CharField(max_length=100, blank=True)
    hora_apertura = models.CharField(max_length=10, blank=True)
    inicio_servicio = models.CharField(max_length=10, blank=True)
    hora_cierre = models.CharField(max_length=10, blank=True)
    horas_extras = models.FloatField(default=0)
    horas_menos_reposo = models.FloatField(default=0)
    horas_nocturnas = models.FloatField(default=0)
    horas_manejo = models.FloatField(default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    observacion_il = models.TextField(blank=True)

    class Meta:
        db_table = 'registro_operativo'

    def __str__(self):
        return f"{self.rut_trabajador} - {self.fecha}"


class AusenciaTemporal(models.Model):
    TIPO_CHOICES = [
        ('LICENCIA', 'Licencia'),
        ('PERMISO', 'Permiso'),
        ('BAJA', 'Baja'),
        ('VACACIONES', 'Vacaciones'),
    ]

    fecha = models.DateField()
    rut = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='ausencias', to_field='rut', db_column='rut')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    motivo = models.TextField(blank=True)
    dias = models.IntegerField(default=1)
    registrado_por = models.CharField(max_length=100, blank=True)
    ts = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ausencias_temporales'
        unique_together = ['fecha', 'rut']

    def __str__(self):
        return f"{self.rut} - {self.tipo} ({self.fecha})"
