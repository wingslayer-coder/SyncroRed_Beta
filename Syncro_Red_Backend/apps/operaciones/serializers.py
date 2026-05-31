from rest_framework import serializers
from .models import (
    ServicioActivo, ServicioHistorico, RegistroEstacion,
    MaestroTurno, GraficoMensual, ItinerarioEquipo
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
