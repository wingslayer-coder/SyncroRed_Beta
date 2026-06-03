import datetime
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from .models import Prevencion, EstacionVia
from .serializers import PrevencionSerializer, EstacionViaSerializer
from .parser import parsear_excel
from .georef import georef_prevencion

ROLES_CARGA = {'IL', 'INSPECTOR DE LINEA', 'SL', 'SUPERVISOR DE LINEA',
               'JEFE DE OPERACIONES', 'ADMIN', 'GERENTE', 'GERENCIA'}


class PrevencionViewSet(viewsets.ModelViewSet):
    serializer_class = PrevencionSerializer

    def get_queryset(self):
        qs = Prevencion.objects.all().order_by('linea', 'hora_inicio')
        linea = self.request.query_params.get('linea')
        solo_activas = self.request.query_params.get('activas')
        if linea:
            qs = qs.filter(linea=linea)
        if solo_activas in ('1', 'true', 'True'):
            qs = qs.filter(activa=True)
        return qs

    @action(detail=False, methods=['post'])
    def eliminar_todas(self, request):
        """Borra las prevenciones de faenas actuales (solo jefatura) para cargar nuevas."""
        cargo = (getattr(request.user, 'cargo', '') or '').upper()
        if cargo not in ROLES_CARGA:
            return Response({'error': 'Sin permisos'}, status=status.HTTP_403_FORBIDDEN)
        n, _ = Prevencion.objects.filter(seccion='faena_inicio').delete()
        return Response({'ok': True, 'eliminadas': n})

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def cargar_excel(self, request):
        """Sube y procesa el Excel de prevenciones (solo jefatura). Reemplaza las faenas de inicio."""
        cargo = (getattr(request.user, 'cargo', '') or '').upper()
        if cargo not in ROLES_CARGA:
            return Response({'error': 'Sin permisos para cargar prevenciones'}, status=status.HTTP_403_FORBIDDEN)

        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'Adjunte el archivo Excel en el campo "archivo"'}, status=400)

        fecha = request.data.get('fecha_emision') or str(datetime.date.today())
        try:
            prevenciones, advertencias = parsear_excel(archivo)
        except Exception as e:
            return Response({'error': f'No se pudo procesar el Excel: {e}'}, status=400)

        # Georreferenciar cada prevención (PK → lat/lon sobre el trazado real)
        for p in prevenciones:
            georef_prevencion(p)
        geo_ok = sum(1 for p in prevenciones if p.get('latitud') is not None)

        with transaction.atomic():
            # Reemplazar las faenas de inicio (no toca las cortadas)
            Prevencion.objects.filter(seccion='faena_inicio').delete()
            objs = [Prevencion(fecha_emision=fecha, activa=True, **p) for p in prevenciones]
            Prevencion.objects.bulk_create(objs)

        return Response({
            'ok': True,
            'creadas': len(prevenciones),
            'georreferenciadas': geo_ok,
            'por_linea': {
                'L1': sum(1 for p in prevenciones if p['linea'] == 'L1'),
                'L2': sum(1 for p in prevenciones if p['linea'] == 'L2'),
            },
            'advertencias': advertencias,
        })


class EstacionViaViewSet(viewsets.ModelViewSet):
    queryset = EstacionVia.objects.all()
    serializer_class = EstacionViaSerializer


from rest_framework.views import APIView
from .trazado_data import TRAZADO, ESTACIONES


class TrazadoView(APIView):
    """Devuelve las polilíneas del trazado y las estaciones para dibujar en el mapa."""

    def get(self, request):
        colores = {'L1': '#1f4e79', 'L2': '#c0392b'}
        nombres = {'L1': 'Línea 1 — San Rosendo / Talcahuano', 'L2': 'Línea 2 — Concepción / Coronel'}
        lineas = []
        for key in ('L1', 'L2'):
            puntos = [[p[1], p[2]] for p in TRAZADO.get(key, [])]
            estaciones = [{'nombre': e[0], 'lat': e[1], 'lon': e[2]} for e in ESTACIONES.get(key, [])]
            lineas.append({
                'linea': key, 'nombre': nombres[key], 'color': colores[key],
                'puntos': puntos, 'estaciones': estaciones,
            })
        return Response({'lineas': lineas})
