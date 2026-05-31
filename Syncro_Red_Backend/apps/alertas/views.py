from rest_framework import viewsets, decorators, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Emergencia, Incidencia, FallaEquipo
from .serializers import EmergenciaSerializer, IncidenciaSerializer, FallaEquipoSerializer
from .filters import EmergenciaFilter, IncidenciaFilter, FallaEquipoFilter


class EmergenciaViewSet(viewsets.ModelViewSet):
    queryset = Emergencia.objects.all().order_by('-fecha_hora')
    serializer_class = EmergenciaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = EmergenciaFilter

    @decorators.action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        emergencia = self.get_object()
        emergencia.estado_alerta = 'CONTROLADA'
        emergencia.save()
        return Response({'estado': 'CONTROLADA'})


class IncidenciaViewSet(viewsets.ModelViewSet):
    queryset = Incidencia.objects.all().order_by('-fecha_hora')
    serializer_class = IncidenciaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = IncidenciaFilter

    @decorators.action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        incidencia = self.get_object()
        incidencia.estado = 'RESUELTA'
        incidencia.save()
        return Response({'estado': 'RESUELTA'})


class FallaEquipoViewSet(viewsets.ModelViewSet):
    queryset = FallaEquipo.objects.all().order_by('-fecha_hora')
    serializer_class = FallaEquipoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = FallaEquipoFilter

    @decorators.action(detail=True, methods=['post'])
    def gestionar(self, request, pk=None):
        falla = self.get_object()
        falla.estado = 'GESTIONADA'
        falla.save()
        return Response({'estado': 'GESTIONADA'})
