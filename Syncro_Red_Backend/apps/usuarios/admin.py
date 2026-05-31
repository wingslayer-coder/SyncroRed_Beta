from django.contrib import admin
from .models import Usuario, RegistroOperativo, AusenciaTemporal

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['rut', 'nombre', 'apellido', 'cargo', 'is_active', 'is_staff']
    list_filter = ['cargo', 'is_active', 'is_staff']
    search_fields = ['rut', 'nombre', 'apellido']

@admin.register(RegistroOperativo)
class RegistroOperativoAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'rut_trabajador', 'lugar_apertura', 'estado']
    list_filter = ['estado', 'fecha']

@admin.register(AusenciaTemporal)
class AusenciaTemporalAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'rut', 'tipo', 'dias']
    list_filter = ['tipo']
