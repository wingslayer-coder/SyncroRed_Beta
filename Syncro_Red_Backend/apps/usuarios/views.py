from rest_framework import viewsets, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Usuario, RegistroOperativo, AusenciaTemporal
from .serializers import UsuarioSerializer, RegistroOperativoSerializer, AusenciaTemporalSerializer


class LoginRutView(views.APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        rut = request.data.get('rut')
        password = request.data.get('password')

        if not rut or not password:
            return Response({'error': 'RUT y contraseña son requeridos'}, status=400)

        try:
            user = Usuario.objects.get(rut=rut)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=401)

        if not user.check_password(password):
            return Response({'error': 'Credenciales inválidas'}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'usuario': {
                'rut': user.rut,
                'nombre': user.nombre,
                'apellido': user.apellido,
                'cargo': user.cargo,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
            }
        })


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class RegistroOperativoViewSet(viewsets.ModelViewSet):
    queryset = RegistroOperativo.objects.all()
    serializer_class = RegistroOperativoSerializer


class AusenciaTemporalViewSet(viewsets.ModelViewSet):
    queryset = AusenciaTemporal.objects.all()
    serializer_class = AusenciaTemporalSerializer


class MeView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'rut': user.rut,
            'nombre': user.nombre,
            'apellido': user.apellido,
            'cargo': user.cargo,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
        })
