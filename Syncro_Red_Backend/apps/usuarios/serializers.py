from rest_framework import serializers
from .models import Usuario, RegistroOperativo, AusenciaTemporal


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['rut', 'nombre', 'apellido', 'cargo', 'is_active', 'is_staff', 'must_change_password', 'date_joined']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
            instance.must_change_password = False
        instance.save()
        return instance


class RegistroOperativoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroOperativo
        fields = '__all__'


class AusenciaTemporalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AusenciaTemporal
        fields = '__all__'
