from rest_framework import serializers
from .models import (
    ServicioActivo, ServicioHistorico, RegistroEstacion,
    MaestroTurno, GraficoMensual, ItinerarioEquipo,
    ParejaTripulacion, Feriado
)


class ServicioActivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicioActivo
        fields = '__all__'


class ServicioHistoricoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicioHistorico
        fields = '__all__'


class RegistroEstacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroEstacion
        fields = '__all__'


class MaestroTurnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaestroTurno
        fields = '__all__'


class GraficoMensualSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraficoMensual
        fields = '__all__'


class ItinerarioEquipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItinerarioEquipo
        fields = '__all__'


class ParejaTripulacionSerializer(serializers.ModelSerializer):
    maquinista_nombre = serializers.SerializerMethodField()
    ayudante_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ParejaTripulacion
        fields = ['id', 'orden', 'maquinista', 'ayudante', 'activa',
                  'maquinista_nombre', 'ayudante_nombre']

    def get_maquinista_nombre(self, obj):
        return f"{obj.maquinista.nombre} {obj.maquinista.apellido}".strip() if obj.maquinista else None

    def get_ayudante_nombre(self, obj):
        return f"{obj.ayudante.nombre} {obj.ayudante.apellido}".strip() if obj.ayudante else None


class FeriadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feriado
        fields = '__all__'
