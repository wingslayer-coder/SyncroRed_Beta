import django_filters
from .models import ServicioActivo, RegistroEstacion, ItinerarioEquipo


class ServicioActivoFilter(django_filters.FilterSet):
    fecha = django_filters.DateFilter(field_name='fecha')
    fecha_gte = django_filters.DateFilter(field_name='fecha', lookup_expr='gte')
    fecha_lte = django_filters.DateFilter(field_name='fecha', lookup_expr='lte')
    estado = django_filters.CharFilter(field_name='estado')
    tren_num = django_filters.CharFilter(field_name='tren_num', lookup_expr='icontains')
    equipo_id = django_filters.CharFilter(field_name='equipo_id', lookup_expr='icontains')
    maquinista = django_filters.CharFilter(field_name='maquinista', lookup_expr='icontains')

    class Meta:
        model = ServicioActivo
        fields = ['fecha', 'estado', 'tren_num', 'equipo_id', 'maquinista']


class RegistroEstacionFilter(django_filters.FilterSet):
    fecha = django_filters.DateFilter(field_name='fecha')
    tren_num = django_filters.CharFilter(field_name='tren_num', lookup_expr='icontains')
    estacion_id = django_filters.CharFilter(field_name='estacion_id', lookup_expr='icontains')
    estado = django_filters.CharFilter(field_name='estado')

    class Meta:
        model = RegistroEstacion
        fields = ['fecha', 'tren_num', 'estacion_id', 'estado']


class ItinerarioEquipoFilter(django_filters.FilterSet):
    fecha = django_filters.DateFilter(field_name='fecha')
    equipo = django_filters.CharFilter(field_name='equipo', lookup_expr='icontains')
    estado = django_filters.CharFilter(field_name='estado')

    class Meta:
        model = ItinerarioEquipo
        fields = ['fecha', 'equipo', 'estado']
