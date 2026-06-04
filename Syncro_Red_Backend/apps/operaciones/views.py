from rest_framework import viewsets, decorators, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from .models import (
    ServicioActivo, ServicioHistorico, RegistroEstacion, MaestroTurno, GraficoMensual,
    ItinerarioEquipo, ParejaTripulacion, Feriado
)
from .serializers import (
    ServicioActivoSerializer, ServicioHistoricoSerializer, RegistroEstacionSerializer,
    MaestroTurnoSerializer, GraficoMensualSerializer, ItinerarioEquipoSerializer,
    ParejaTripulacionSerializer, FeriadoSerializer
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

    def perform_destroy(self, instance):
        # Al eliminar un servicio se borran también sus pasadas, para que
        # volver a cargar el mismo tren/fecha empiece sin marcas previas.
        RegistroEstacion.objects.filter(
            fecha=instance.fecha, tren_num=instance.tren_num
        ).delete()
        instance.delete()

    @decorators.action(detail=True, methods=['get'])
    def pasadas(self, request, pk=None):
        servicio = self.get_object()
        registros = RegistroEstacion.objects.filter(
            fecha=servicio.fecha,
            tren_num=servicio.tren_num
        ).order_by('timestamp')
        data = [
            {
                'estacion': r.estacion_id,
                'estado': r.estado,
                'minutos_atraso': int(r.obs) if r.obs and r.obs.lstrip('-').isdigit() else 0,
                'timestamp': r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in registros
        ]
        return Response({'tren_num': servicio.tren_num, 'pasadas': data})

    @decorators.action(detail=False, methods=['get'])
    def mis_servicios(self, request):
        """Servicios de la fecha donde el usuario autenticado es maquinista o ayudante,
        con sus pasadas y eventos asociados — para la bitácora compartida en tiempo real."""
        from django.db.models import Q
        fecha = request.query_params.get('fecha') or str(timezone.now().date())
        rut = getattr(request.user, 'rut', '') or ''

        servicios = ServicioActivo.objects.filter(fecha=fecha).filter(
            Q(rut_maquinista=rut) | Q(rut_ayudante=rut)
        ).exclude(estado='CERRADO').order_by('tren_num')

        data = []
        for srv in servicios:
            registros = RegistroEstacion.objects.filter(
                fecha=srv.fecha, tren_num=srv.tren_num
            ).order_by('timestamp')
            pasadas = [
                {
                    'estacion': r.estacion_id,
                    'estado': r.estado,
                    'minutos_atraso': int(r.obs) if r.obs and r.obs.lstrip('-').isdigit() else 0,
                    'timestamp': r.timestamp.isoformat() if r.timestamp else None,
                }
                for r in registros
            ]

            incidencias = list(Incidencia.objects.filter(fecha=srv.fecha, tren_num=srv.tren_num).values(
                'id', 'fecha_hora', 'tipo_incidencia', 'detalle', 'ubicacion', 'estado', 'nombre_reporta'))
            fallas = list(FallaEquipo.objects.filter(
                fecha_hora__date=srv.fecha, tren_num=srv.tren_num).values(
                'id', 'fecha_hora', 'sistema_afectado', 'detalle', 'estado', 'nombre_reporta'))
            emergencias = list(Emergencia.objects.filter(
                fecha_hora__date=srv.fecha, tren_num=srv.tren_num).values(
                'id', 'fecha_hora', 'tipo_evento', 'ubicacion', 'estado_alerta', 'nombre_reporta'))

            data.append({
                'id': srv.id,
                'fecha': str(srv.fecha),
                'tren_num': srv.tren_num,
                'equipo_id': srv.equipo_id,
                'maquinista': srv.maquinista,
                'ayudante': srv.ayudante,
                'rut_maquinista': srv.rut_maquinista,
                'rut_ayudante': srv.rut_ayudante,
                'estado': srv.estado,
                'pasadas': pasadas,
                'incidencias': incidencias,
                'fallas': fallas,
                'emergencias': emergencias,
            })

        return Response({'fecha': fecha, 'servicios': data})

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

    def create(self, request, *args, **kwargs):
        """Idempotente: si ya existe registro para (fecha, tren_num, estacion_id) lo actualiza,
        evitando el 400 por unique_together cuando ambos miembros de la tripulación marcan."""
        data = request.data
        fecha = data.get('fecha')
        tren_num = data.get('tren_num')
        estacion_id = data.get('estacion_id')
        if fecha and tren_num and estacion_id:
            obj, created = RegistroEstacion.objects.update_or_create(
                fecha=fecha, tren_num=tren_num, estacion_id=estacion_id,
                defaults={
                    'estado': data.get('estado', 'SIN MARCAR'),
                    'obs': data.get('obs', ''),
                    'color': data.get('color', ''),
                },
            )
            serializer = self.get_serializer(obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


class MaestroTurnoViewSet(viewsets.ModelViewSet):
    queryset = MaestroTurno.objects.all().order_by('num_turno')
    serializer_class = MaestroTurnoSerializer

    @decorators.action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def cargar_csv(self, request):
        """Carga el Maestro de Turnos desde CSV (solo ADMIN)."""
        if (getattr(request.user, 'cargo', '') or '').upper() != 'ADMIN':
            return Response({'error': 'Solo el administrador puede cargar el maestro de turnos'}, status=status.HTTP_403_FORBIDDEN)
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'Adjunte el archivo CSV en el campo "archivo"'}, status=400)
        from .importadores import importar_maestro_turnos
        try:
            res = importar_maestro_turnos(archivo)
        except Exception as e:
            return Response({'error': f'No se pudo procesar el CSV: {e}'}, status=400)
        return Response({'ok': True, **res})


class GraficoMensualViewSet(viewsets.ModelViewSet):
    serializer_class = GraficoMensualSerializer
    pagination_class = None  # el gráfico de un mes son ~2940 filas: devolver todo filtrado

    def get_queryset(self):
        qs = GraficoMensual.objects.all().order_by('fecha')
        anio = self.request.query_params.get('anio')
        mes = self.request.query_params.get('mes')
        if anio:
            qs = qs.filter(fecha__year=anio)
        if mes:
            qs = qs.filter(fecha__month=mes)
        return qs

    @decorators.action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def cargar_csv(self, request):
        """Carga manual del gráfico mensual desde CSV grilla (RUT;1;2;...). Solo ADMIN."""
        if (getattr(request.user, 'cargo', '') or '').upper() != 'ADMIN':
            return Response({'error': 'Solo el administrador puede cargar el gráfico'}, status=status.HTTP_403_FORBIDDEN)
        try:
            anio = int(request.data.get('anio'))
            mes = int(request.data.get('mes'))
        except (TypeError, ValueError):
            return Response({'error': 'anio y mes son requeridos'}, status=400)
        archivo = request.FILES.get('archivo')
        if not archivo:
            return Response({'error': 'Adjunte el archivo CSV en el campo "archivo"'}, status=400)
        from .importadores import importar_grafico_csv
        try:
            res = importar_grafico_csv(archivo, anio, mes)
        except Exception as e:
            return Response({'error': f'No se pudo procesar el CSV: {e}'}, status=400)
        return Response({'ok': True, 'anio': anio, 'mes': mes, **res})


class ItinerarioEquipoViewSet(viewsets.ModelViewSet):
    queryset = ItinerarioEquipo.objects.all().order_by('-fecha', 'equipo')
    serializer_class = ItinerarioEquipoSerializer


ROLES_GRAFICO = {'IL', 'INSPECTOR DE LINEA', 'SL', 'SUPERVISOR DE LINEA',
                 'JEFE DE OPERACIONES', 'ADMIN', 'GERENTE', 'GERENCIA'}


def _es_jefatura(request):
    return (getattr(request.user, 'cargo', '') or '').upper() in ROLES_GRAFICO


class ParejaTripulacionViewSet(viewsets.ModelViewSet):
    queryset = ParejaTripulacion.objects.all().order_by('orden')
    serializer_class = ParejaTripulacionSerializer
    pagination_class = None

    @decorators.action(detail=False, methods=['post'])
    def auto_emparejar(self, request):
        if not _es_jefatura(request):
            return Response({'error': 'Sin permisos'}, status=status.HTTP_403_FORBIDDEN)
        from .rostering import auto_emparejar
        creadas = auto_emparejar()
        return Response({'ok': True, 'creadas': creadas,
                         'total': ParejaTripulacion.objects.count()})

    @decorators.action(detail=False, methods=['post'])
    def intercambiar(self, request):
        """Intercambia un miembro entre dos parejas. Body: {pareja_a, pareja_b, campo}."""
        if not _es_jefatura(request):
            return Response({'error': 'Sin permisos'}, status=status.HTTP_403_FORBIDDEN)
        campo = request.data.get('campo')
        if campo not in ('maquinista', 'ayudante'):
            return Response({'error': "campo debe ser 'maquinista' o 'ayudante'"}, status=400)
        try:
            a = ParejaTripulacion.objects.get(pk=request.data.get('pareja_a'))
            b = ParejaTripulacion.objects.get(pk=request.data.get('pareja_b'))
        except ParejaTripulacion.DoesNotExist:
            return Response({'error': 'Pareja no encontrada'}, status=404)
        va, vb = getattr(a, f'{campo}_id'), getattr(b, f'{campo}_id')
        setattr(a, f'{campo}_id', vb)
        setattr(b, f'{campo}_id', va)
        a.save()
        b.save()
        return Response({'ok': True})


class FeriadoViewSet(viewsets.ModelViewSet):
    queryset = Feriado.objects.all().order_by('fecha')
    serializer_class = FeriadoSerializer
    pagination_class = None


class GenerarGraficoView(APIView):
    """Genera automáticamente el gráfico mensual completo a partir de las parejas registradas."""

    def post(self, request):
        if not _es_jefatura(request):
            return Response({'error': 'Solo jefatura puede generar el gráfico'}, status=status.HTTP_403_FORBIDDEN)
        try:
            anio = int(request.data.get('anio'))
            mes = int(request.data.get('mes'))
        except (TypeError, ValueError):
            return Response({'error': 'anio y mes son requeridos'}, status=400)
        from .rostering import generar_mes
        reporte = generar_mes(anio, mes)
        if not reporte.get('ok'):
            return Response(reporte, status=400)
        return Response(reporte)


class PautaDiariaView(APIView):
    """Devuelve la pauta diaria combinando maestro de turnos, gráfico mensual y usuarios."""

    def get(self, request):
        fecha = request.query_params.get('fecha')
        if not fecha:
            return Response({'error': 'Parámetro fecha requerido (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        import datetime as dt
        fecha_obj = dt.date.fromisoformat(fecha)
        weekday = fecha_obj.isoweekday()
        if weekday == 7:
            tipo_dia = 'DOM'
        elif weekday == 6:
            tipo_dia = 'SAB'
        else:
            tipo_dia = 'LV'

        graficos = GraficoMensual.objects.filter(fecha=fecha).select_related('rut')

        # Trabajadores con ausencia (licencia/baja/permiso/vacaciones) ese día → liberan su turno.
        ausentes = {
            a['rut__rut']: a['tipo']
            for a in AusenciaTemporal.objects.filter(fecha=fecha).values('rut__rut', 'tipo')
        }

        maestro_map = {
            mt.num_turno.strip(): mt
            for mt in MaestroTurno.objects.filter(tipo_dia=tipo_dia)
        }

        def es_descanso(num):
            """Día libre ('L') o turno cuyo servicio es DESCANSO."""
            if num in ('L', ''):
                return True
            mt = maestro_map.get(num)
            return bool(mt and 'DESCANSO' in (mt.servicios or '').upper())

        def _nuevo_turno(num):
            return {
                'turno': num,
                'mq_nombre': None, 'mq_rut': None, 'mq_ausente': None,
                'ay_nombre': None, 'ay_rut': None, 'ay_ausente': None,
                'servicios': '---',
                'apertura_hora': '---', 'apertura_lugar': '---',
                'presentacion_hora': '---', 'presentacion_lugar': '---',
                'cierre_hora': '---', 'cierre_lugar': '---',
            }

        turnos = {}
        descansos = []
        for g in graficos:
            num = g.num_turno.strip()
            cargo = (g.rut.cargo or '').upper()
            nombre_completo = f"{g.rut.nombre} {g.rut.apellido}".strip()

            if es_descanso(num):
                continue  # descansos se calculan aparte más abajo (no se ven afectados por ausencias)

            if num not in turnos:
                turnos[num] = _nuevo_turno(num)

            esta_ausente = g.rut.rut in ausentes
            info_aus = {'nombre': nombre_completo, 'rut': g.rut.rut, 'tipo': ausentes.get(g.rut.rut)} if esta_ausente else None

            if 'MAQUINISTA' in cargo:
                if esta_ausente:
                    turnos[num]['mq_ausente'] = info_aus  # slot queda vacante para reasignar
                else:
                    turnos[num]['mq_nombre'] = nombre_completo
                    turnos[num]['mq_rut'] = g.rut.rut
            elif 'AYUDANTE' in cargo:
                if esta_ausente:
                    turnos[num]['ay_ausente'] = info_aus
                else:
                    turnos[num]['ay_nombre'] = nombre_completo
                    turnos[num]['ay_rut'] = g.rut.rut

        # Descansos (incluye 'L'/DESCANSO); los ausentes en descanso no aportan a la pauta.
        for g in graficos:
            num = g.num_turno.strip()
            if es_descanso(num) and g.rut.rut not in ausentes:
                descansos.append({
                    'nombre': f"{g.rut.nombre} {g.rut.apellido}".strip(),
                    'rut': g.rut.rut,
                    'cargo': g.rut.cargo,
                })

        # Ordenar descansos: maquinistas primero, luego ayudantes, luego por nombre
        def _orden_cargo(c):
            cu = (c.get('cargo') or '').upper()
            return (0 if 'MAQUINISTA' in cu else 1 if 'AYUDANTE' in cu else 2, c['nombre'])
        descansos.sort(key=_orden_cargo)

        resultado = []
        for num in sorted(turnos.keys()):
            item = turnos[num]
            mt = maestro_map.get(num)
            if mt:
                item['servicios'] = mt.servicios or '---'
                item['apertura_hora'] = mt.apertura_hora or '---'
                item['apertura_lugar'] = mt.apertura_lugar or '---'
                item['presentacion_hora'] = mt.presentacion_hora or '---'
                item['presentacion_lugar'] = mt.presentacion_lugar or '---'
                item['cierre_hora'] = mt.cierre_hora or '---'
                item['cierre_lugar'] = mt.cierre_lugar or '---'
            resultado.append(item)

        return Response({'fecha': fecha, 'tipo_dia': tipo_dia, 'turnos': resultado, 'descansos': descansos})

    def post(self, request):
        ROLES_ASIGNACION = {'IL', 'INSPECTOR DE LINEA', 'SL', 'SUPERVISOR DE LINEA',
                            'JEFE DE OPERACIONES', 'ADMIN', 'GERENTE', 'GERENCIA'}
        cargo_usuario = (getattr(request.user, 'cargo', '') or '').upper()
        if cargo_usuario not in ROLES_ASIGNACION:
            return Response({'error': 'No tiene permisos para asignar tripulación'}, status=status.HTTP_403_FORBIDDEN)

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


class MiTurnoView(APIView):
    """Devuelve el turno asignado al usuario autenticado para la fecha dada."""

    def get(self, request):
        fecha = request.query_params.get('fecha')
        if not fecha:
            return Response({'error': 'Parámetro fecha requerido'}, status=400)

        try:
            grafico = GraficoMensual.objects.select_related('rut').get(fecha=fecha, rut=request.user)
        except GraficoMensual.DoesNotExist:
            return Response({'turno': None, 'mensaje': 'Sin turno asignado para esta fecha'})

        num_turno = grafico.num_turno.strip()

        weekday = __import__('datetime').date.fromisoformat(fecha).isoweekday()
        tipo_dia = 'DOM' if weekday == 7 else 'SAB' if weekday == 6 else 'LV'

        try:
            mt = MaestroTurno.objects.get(num_turno=num_turno, tipo_dia=tipo_dia)
            return Response({
                'turno': num_turno,
                'tipo_dia': tipo_dia,
                'servicios': mt.servicios or '---',
                'presentacion_hora': mt.presentacion_hora or '---',
                'presentacion_lugar': mt.presentacion_lugar or '---',
                'cierre_hora': mt.cierre_hora or '---',
                'cierre_lugar': mt.cierre_lugar or '---',
            })
        except MaestroTurno.DoesNotExist:
            return Response({
                'turno': num_turno,
                'tipo_dia': tipo_dia,
                'servicios': '---',
                'presentacion_hora': '---',
                'presentacion_lugar': '---',
                'cierre_hora': '---',
                'cierre_lugar': '---',
            })


class TripulacionDisponibleView(APIView):
    """Devuelve maquinistas o ayudantes disponibles para una fecha (sin ausencia ni turno asignado)."""

    def get(self, request):
        fecha = request.query_params.get('fecha')
        cargo_filtro = request.query_params.get('cargo', '').upper()

        if not fecha:
            return Response({'error': 'Parámetro fecha requerido'}, status=status.HTTP_400_BAD_REQUEST)

        import datetime as _dt
        weekday = _dt.date.fromisoformat(fecha).isoweekday()
        tipo_dia = 'DOM' if weekday == 7 else 'SAB' if weekday == 6 else 'LV'
        maestro_map = {mt.num_turno.strip(): mt for mt in MaestroTurno.objects.filter(tipo_dia=tipo_dia)}

        ausentes = set(
            AusenciaTemporal.objects.filter(fecha=fecha).values_list('rut__rut', flat=True)
        )

        # "Ocupado" = trabaja un turno operativo real (no libre, no recibidor).
        # Libres y recibidores quedan disponibles para cubrir. Se anota su estado.
        estado_disp = {}
        ocupados = set(ausentes)
        for g in GraficoMensual.objects.filter(fecha=fecha).select_related('rut'):
            num = g.num_turno.strip()
            rut = g.rut.rut
            if num in ('', 'L'):
                estado_disp[rut] = 'Libre / disponible'
                continue
            mt = maestro_map.get(num)
            serv = (mt.servicios or '').upper() if mt else ''
            if 'REC' in serv:
                estado_disp[rut] = f'Recibidor (turno {num})'
            else:
                ocupados.add(rut)  # en turno de servicio → no disponible

        qs = Usuario.objects.filter(is_active=True)
        if 'MAQUINISTA' in cargo_filtro:
            qs = qs.filter(cargo__icontains='MAQUINISTA')
        elif 'AYUDANTE' in cargo_filtro:
            qs = qs.filter(cargo__icontains='AYUDANTE')
        else:
            qs = qs.filter(cargo__icontains='MAQUINISTA') | qs.filter(cargo__icontains='AYUDANTE')

        qs = qs.exclude(rut__in=ocupados).order_by('nombre')

        data = [
            {'rut': u.rut, 'nombre': f"{u.nombre} {u.apellido}".strip(), 'cargo': u.cargo,
             'estado': estado_disp.get(u.rut, 'Sin programación')}
            for u in qs
        ]
        # Recibidores primero (disponibles presenciales), luego libres
        data.sort(key=lambda d: (0 if 'Recibidor' in d['estado'] else 1, d['nombre']))
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
        # Las emergencias controladas/cerradas dejan de mostrarse como activas en el mapa.
        emergencias = Emergencia.objects.filter(
            fecha_hora__date__gte=fecha_desde, fecha_hora__date__lte=fecha_hasta
        ).exclude(estado_alerta__in=['CONTROLADA', 'CERRADA'])
        fallas = FallaEquipo.objects.filter(fecha_hora__date__gte=fecha_desde, fecha_hora__date__lte=fecha_hasta)

        eventos = []
        for inc in incidencias:
            eventos.append({
                'id': f"inc_{inc.id}",
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
                'notificado_por': inc.nombre_reporta,
                'lat': inc.latitud,
                'lon': inc.longitud,
                'estado': inc.estado,
            })

        for em in emergencias:
            eventos.append({
                'id': f"em_{em.id}",
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
                'notificado_por': em.nombre_reporta,
                'lat': em.latitud,
                'lon': em.longitud,
                'estado': em.estado_alerta,
            })
            
        for falla in fallas:
            eventos.append({
                'id': f"falla_{falla.id}",
                'tipo': 'Falla de Equipo',
                'color': '#FF8C00',
                'fecha_hora': falla.fecha_hora.isoformat() if falla.fecha_hora else None,
                'fecha': str(falla.fecha_hora.date()) if falla.fecha_hora else None,
                'tren': falla.tren_num,
                'equipo': falla.equipo,
                'maquinista': '',
                'ayudante': '',
                'evento': falla.sistema_afectado,
                'detalle': falla.detalle,
                'ubicacion': '',
                'notificado_por': falla.nombre_reporta,
                'lat': falla.latitud,
                'lon': falla.longitud,
                'estado': falla.estado,
            })

        return Response({'fecha_desde': fecha_desde, 'fecha_hasta': fecha_hasta, 'eventos': eventos})
