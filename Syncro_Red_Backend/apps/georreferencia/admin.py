from django.contrib import admin
from .models import HitoGeorreferencia

@admin.register(HitoGeorreferencia)
class HitoGeorreferenciaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'punto_kilometrico', 'lat', 'lon']
    list_filter = ['tipo']
    search_fields = ['nombre']
