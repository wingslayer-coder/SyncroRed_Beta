from rest_framework import viewsets, decorators, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from .models import ServicioActivo, ServicioHistorico, RegistroEstacion, MaestroTurno, GraficoMensual, ItinerarioEquipo
from .serializers import (
    ServicioActivoSerializer, ServicioHistoricoSerializer, RegistroEstacionSerializer,
    MaestroTurnoSerializer, GraficoMensualSerializer, ItinerarioEquipoSerializer
)
from .filters import ServicioActivoFilter, RegistroEstacionFilter, ItinerarioEquipoFilter
from apps.usuarios.models import Usuario, AusenciaTemporal
from apps.alertas.models import Emergencia, Incidencia, FallaEquipo
from apps.bitacora.models import ReporteFinal, NovedadOperativa


class ServicioActivoViewSet(viewsets.ModelViewSet):
    queryset = ServicioActivo.objects.all().order_by('-fecha', 'tren_num')
    serializer_class = ServicioActivoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ServicioActivoFilter

    @decorators.action(detail=True, methods=['post'])
    def ubicacion(self, request, pk=None):
        servicio = self.get_object()
        lat = request.data.get('latitud')
        lon = request.data.get('longitud')
        if lat is not None and lon is not None:
            servicio.latitud = float(lat)
            servicio.longitud = float(lon)
            servicio.timestamp_gps = timezone.now()
            servicio.save()
            return Response({'ok': True, 'latitud': servicio.latitud, 'longitud': servicio.longitud})
        return Response({'error': 'latitud y longitud requeridas'}, status=400)


class ServicioHistoricoViewSet(viewsets.ModelViewSet):
    queryset = ServicioHistorico.objects.all().order_by('-fecha')
    serializer_class = ServicioHistoricoSerializer


class RegistroEstacionViewSet(viewsets.ModelViewSet):
    queryset = RegistroEstacion.objects.all().order_by('-timestamp')
    serializer_class = RegistroEstacionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = RegistroEstacionFilter


class MaestroTurnoViewSet(viewsets.ModelViewSet):
    queryset = MaestroTurno.objects.all().order_by('num_turno')
    serializer_class = MaestroTurnoSerializer


class GraficoMensualViewSet(viewsets.ModelViewSet):
    queryset = GraficoMensual.objects.all().order_by('-fecha')
    serializer_class = GraficoMensualSerializer


class ItinerarioEquipoViewSet(viewsets.ModelViewSet):
    queryset = ItinerarioEquipo.objects.all().order_by('-fecha', 'equipo')
    serializer_class = ItinerarioEquipoSerializer


class PautaDiariaView(APIView):
    """Devuelve la pauta diaria combinando maestro de turnos, gráfico mensual y usuarios."""

    def get(self, request):
        fecha = request.query_params.get('fecha')
        if not fecha:
            return Response({'error': 'Parámetro fecha requerido (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        weekday = fecha.isoweekday()
        if weekday == 7:
            tipo_dia = 'DOM'
        elif weekday == 6:
            tipo_dia = 'SAB'
        else:
            tipo_dia = 'LV'

        graficos = GraficoMensual.objects.filter(fecha=fecha).exclude(num_turno='L').select_related('rut')

        turnos = {}
        for g in graficos:
            num = g.num_turno.strip()
            if num not in turnos:
                turnos[num] = {
                    'turno': num,
                    'mq_nombre': None,
                    'mq_rut': None,
                    'ay_nombre': None,
                    'ay_rut': None,
                    'servicios': '---',
                    'presentacion_hora': '---',
                    'presentacion_lugar': '---',
                    'cierre_hora': '---',
                    'cierre_lugar': '---',
                }
            cargo = (g.rut.cargo or '').upper()
            nombre_completo = f"{g.rut.nombre} {g.rut.apellido}".strip()
            if 'MAQUINISTA' in cargo:
                turnos[num]['mq_nombre'] = nombre_completo
                turnos[num]['mq_rut'] = g.rut.rut
            elif 'AYUDANTE' in cargo:
                turnos[num]['ay_nombre'] = nombre_completo
                turnos[num]['ay_rut'] = g.rut.rut

        maestro_map = {
            mt.num_turno.strip(): mt
            for mt in MaestroTurno.objects.filter(tipo_dia=tipo_dia)
        }

        resultado = []
        for num in sorted(turnos.keys()):
            item = turnos[num]
            mt = maestro_map.get(num)
            if mt:
                item['servicios'] = mt.servicios or '---'
                item['presentacion_hora'] = mt.presentacion_hora or '---'
                item['presentacion_lugar'] = mt.presentacion_lugar or '---'
                item['cierre_hora'] = mt.cierre_hora or '---'
                item['cierre_lugar'] = mt.cierre_lugar or '---'
            resultado.append(item)

        return Response({'fecha': fecha, 'tipo_dia': tipo_dia, 'turnos': resultado})

    def post(self, request):
        fecha = request.data.get('fecha')
        rut = request.data.get('rut')
        num_turno = request.data.get('num_turno')

        if not fecha or not rut or not num_turno:
            return Response({'error': 'fecha, rut y num_turno son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(rut=rut)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            GraficoMensual.objects.update_or_create(
                fecha=fecha, rut=usuario,
                defaults={'num_turno': num_turno.strip()}
            )

        return Response({'ok': True, 'fecha': fecha, 'rut': rut, 'num_turno': num_turno})


class TripulacionDisponibleView(APIView):
    """Devuelve maquinistas o ayudantes disponibles para una fecha (sin ausencia ni turno asignado)."""

    def get(self, request):
        fecha = request.query_params.get('fecha')
        cargo_filtro = request.query_params.get('cargo', '').upper()

        if not fecha:
            return Response({'error': 'Parámetro fecha requerido'}, status=status.HTTP_400_BAD_REQUEST)

        ausentes = set(
            AusenciaTemporal.objects.filter(fecha=fecha).values_list('rut__rut', flat=True)
        )
        asignados = set(
            GraficoMensual.objects.filter(fecha=fecha).values_list('rut__rut', flat=True)
        )
        ocupados = ausentes | asignados

        qs = Usuario.objects.filter(is_active=True)
        if 'MAQUINISTA' in cargo_filtro:
            qs = qs.filter(cargo__icontains='MAQUINISTA')
        elif 'AYUDANTE' in cargo_filtro:
            qs = qs.filter(cargo__icontains='AYUDANTE')
        else:
            qs = qs.filter(cargo__icontains='MAQUINISTA') | qs.filter(cargo__icontains='AYUDANTE')

        qs = qs.exclude(rut__in=ocupados).order_by('nombre')

        data = [
            {'rut': u.rut, 'nombre': f"{u.nombre} {u.apellido}".strip(), 'cargo': u.cargo}
            for u in qs
        ]
        return Response({'fecha': fecha, 'disponibles': data})


class DashboardView(APIView):
    """Devuelve KPIs calculados desde los datos reales del sistema."""

    def get(self, request):
        hoy = timezone.now().date()

        servicios_hoy = ServicioActivo.objects.filter(fecha=hoy).count()
        servicios_mes = ServicioHistorico.objects.filter(fecha__year=hoy.year, fecha__month=hoy.month).count()

        registros_hoy = RegistroEstacion.objects.filter(fecha=hoy)
        total_registros = registros_hoy.count()
        a_tiempo = registros_hoy.filter(estado='A LA HORA').count()
        puntualidad = round((a_tiempo / total_registros * 100), 2) if total_registros else 0.0

        atrasos = NovedadOperativa.objects.filter(fecha=hoy).aggregate(total_minutos=Sum('minutos'))
        atraso_promedio = round(atrasos['total_minutos'] / total_registros, 1) if total_registros and atrasos['total_minutos'] else 0.0

        emergencias_activas = Emergencia.objects.filter(estado_alerta='ACTIVA').count()
        incidencias_activas = Incidencia.objects.filter(estado__in=['REGISTRADA', 'EN GESTION']).count()
        fallas_pendientes = FallaEquipo.objects.filter(estado='PENDIENTE').count()

        tripulacion_total = Usuario.objects.filter(is_active=True, cargo__in=['MAQUINISTA', 'AYUDANTE']).count()
        ausencias_hoy = AusenciaTemporal.objects.filter(fecha=hoy).count()

        reportes_hoy = ReporteFinal.objects.filter(fecha=hoy).count()

        return Response({
            'fecha': str(hoy),
            'servicios_hoy': servicios_hoy,
            'servicios_mes': servicios_mes,
            'puntualidad_otp': puntualidad,
            'atraso_promedio_min': atraso_promedio,
            'emergencias_activas': emergencias_activas,
            'incidencias_activas': incidencias_activas,
            'fallas_pendientes': fallas_pendientes,
            'tripulacion_total': tripulacion_total,
            'ausencias_hoy': ausencias_hoy,
            'reportes_hoy': reportes_hoy,
        })


class EventosMapaView(APIView):
    """Devuelve eventos operacionales (incidencias y emergencias) en un rango de fechas para el mapa."""

    def get(self, request):
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        if not fecha_desde or not fecha_hasta:
            return Response({'error': 'fecha_desde y fecha_hasta son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        incidencias = Incidencia.objects.filter(fecha__gte=fecha_desde, fecha__lte=fecha_hasta)
        emergencias = Emergencia.objects.filter(fecha_hora__date__gte=fecha_desde, fecha_hora__date__lte=fecha_hasta)

        eventos = []
        for inc in incidencias:
            eventos.append({
                'tipo': 'Incidencia',
                'color': '#FFD400',
                'fecha_hora': inc.fecha_hora.isoformat() if inc.fecha_hora else None,
                'fecha': str(inc.fecha),
                'tren': inc.tren_num,
                'equipo': inc.equipo,
                'maquinista': inc.maquinista,
                'ayudante': inc.ayudante,
                'evento': inc.tipo_incidencia,
                'detalle': inc.detalle,
                'ubicacion': inc.ubicacion,
                'lat': inc.latitud,
                'lon': inc.longitud,
                'estado': inc.estado,
            })

        for em in emergencias:
            eventos.append({
                'tipo': 'Emergencia',
                'color': '#D00000',
                'fecha_hora': em.fecha_hora.isoformat() if em.fecha_hora else None,
                'fecha': str(em.fecha_hora.date()) if em.fecha_hora else None,
                'tren': em.tren_num,
                'equipo': em.equipo,
                'maquinista': em.maquinista,
                'ayudante': em.ayudante,
                'evento': em.tipo_evento,
                'detalle': em.ubicacion,
                'ubicacion': em.ubicacion,
                'lat': em.latitud,
                'lon': em.longitud,
                'estado': em.estado_alerta,
            })

        return Response({'fecha_desde': fecha_desde, 'fecha_hasta': fecha_hasta, 'eventos': eventos})
