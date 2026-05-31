from rest_framework import serializers
from .models import Usuario, RegistroOperativo, AusenciaTemporal


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['rut', 'nombre', 'apellido', 'cargo', 'is_active', 'is_staff', 'date_joined']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class RegistroOperativoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroOperativo
        fields = '__all__'


class AusenciaTemporalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AusenciaTemporal
        fields = '__all__'
