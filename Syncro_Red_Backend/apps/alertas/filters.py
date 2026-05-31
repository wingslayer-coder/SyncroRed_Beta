import django_filters
from .models import Emergencia, Incidencia, FallaEquipo


class EmergenciaFilter(django_filters.FilterSet):
    fecha_hora_gte = django_filters.DateTimeFilter(field_name='fecha_hora', lookup_expr='gte')
    fecha_hora_lte = django_filters.DateTimeFilter(field_name='fecha_hora', lookup_expr='lte')
    estado_alerta = django_filters.CharFilter(field_name='estado_alerta')
    tren_num = django_filters.CharFilter(field_name='tren_num', lookup_expr='icontains')

    class Meta:
        model = Emergencia
        fields = ['estado_alerta', 'tren_num']


class IncidenciaFilter(django_filters.FilterSet):
    fecha = django_filters.DateFilter(field_name='fecha')
    estado = django_filters.CharFilter(field_name='estado')
    tipo_incidencia = django_filters.CharFilter(field_name='tipo_incidencia')
    tren_num = django_filters.CharFilter(field_name='tren_num', lookup_expr='icontains')

    class Meta:
        model = Incidencia
        fields = ['fecha', 'estado', 'tipo_incidencia', 'tren_num']


class FallaEquipoFilter(django_filters.FilterSet):
    fecha_hora_gte = django_filters.DateTimeFilter(field_name='fecha_hora', lookup_expr='gte')
    fecha_hora_lte = django_filters.DateTimeFilter(field_name='fecha_hora', lookup_expr='lte')
    estado = django_filters.CharFilter(field_name='estado')
    tren_num = django_filters.CharFilter(field_name='tren_num', lookup_expr='icontains')

    class Meta:
        model = FallaEquipo
        fields = ['estado', 'tren_num']
