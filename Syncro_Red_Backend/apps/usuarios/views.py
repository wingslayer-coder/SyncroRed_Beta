import secrets
from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
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
                'must_change_password': user.must_change_password,
            }
        })


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reset_password(self, request, pk=None):
        """Admin resetea la contraseña de un usuario y genera una temporal."""
        user = self.get_object()
        temp_password = secrets.token_urlsafe(8)
        user.set_password(temp_password)
        user.must_change_password = True
        user.save()
        return Response({
            'temp_password': temp_password,
            'message': f'Contraseña reseteada para {user.rut}. El usuario debe cambiarla al iniciar sesión.'
        })


class ChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 4:
            return Response({'error': 'La contraseña debe tener al menos 4 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.must_change_password = False
        user.save()
        return Response({'message': 'Contraseña actualizada correctamente.'})


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
            'must_change_password': user.must_change_password,
        })
