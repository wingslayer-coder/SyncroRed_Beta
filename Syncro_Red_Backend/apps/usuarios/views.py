import secrets
import datetime
from math import floor
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
            print(f"[DEBUG] NO ENCONTRADO rut={repr(rut)}")
            return Response({'error': 'Usuario no encontrado'}, status=401)

        ok = user.check_password(password)
        print(f"[DEBUG] rut={repr(rut)} pwd={repr(password)} check={ok} stored_hash={user.password[:30]}")
        if not ok:
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


# ─── HELPERS ────────────────────────────────────────────────────────────────

def _parse_hm(s):
    """Parse 'HH:MM' → datetime.datetime (date=today)"""
    return datetime.datetime.strptime(s.strip(), '%H:%M')

def _horas_entre(t_ini, t_fin):
    """Hours between two datetime objects, advancing t_fin a day if needed."""
    if t_fin < t_ini:
        t_fin += datetime.timedelta(days=1)
    return (t_fin - t_ini).total_seconds() / 3600.0

ROLES_JEFATURA = {'IL', 'INSPECTOR DE LINEA', 'SL', 'SUPERVISOR DE LINEA',
                  'JEFE DE OPERACIONES', 'ADMIN', 'GERENTE', 'GERENCIA'}


# ─── ABRIR TURNO ────────────────────────────────────────────────────────────

class AbrirTurnoView(views.APIView):
    permission_classes = [IsAuthenticated]

    # Minutos de traslado desde cada ubicación hasta EZ/LJ (base)
    TRANSFER_MINUTOS = {
        'CW': 90, 'CC': 45, 'LM': 60, 'OH': 90,
        'HQ': 90, 'GU': 90, 'EZ': 0, 'LJ': 0,
    }

    def post(self, request):
        user = request.user
        cargo = (getattr(user, 'cargo', '') or '').upper()
        if cargo not in ('MAQUINISTA', 'AYUDANTE'):
            return Response({'error': 'Solo tripulación puede abrir turno'}, status=status.HTTP_403_FORBIDDEN)

        fecha_hoy = datetime.date.today().isoformat()

        if RegistroOperativo.objects.filter(rut_trabajador=user, fecha=fecha_hoy, hora_cierre='').exists():
            return Response({'error': 'Ya tiene un turno abierto hoy'}, status=status.HTTP_400_BAD_REQUEST)

        lugar           = (request.data.get('lugar_apertura') or '').strip().upper()
        hora_presentacion = (request.data.get('hora_presentacion') or '').strip()   # HH:MM ingresada por trabajador
        coincide        = request.data.get('coincide', True)
        motivo          = (request.data.get('motivo') or '').strip()

        if not lugar or not hora_presentacion:
            return Response({'error': 'lugar_apertura y hora_presentacion son requeridos'}, status=400)

        if lugar not in self.TRANSFER_MINUTOS:
            return Response({'error': f'Lugar inválido. Opciones: {list(self.TRANSFER_MINUTOS)}'}, status=400)

        try:
            t_pres = _parse_hm(hora_presentacion)
        except ValueError:
            return Response({'error': 'Formato de hora inválido. Use HH:MM'}, status=400)

        # Calcular hora de apertura EZ (presentación - traslado)
        transfer = self.TRANSFER_MINUTOS[lugar]
        t_apertura = t_pres - datetime.timedelta(minutes=transfer)
        hora_apertura_ez = t_apertura.strftime('%H:%M')

        # Estado: requiere autorización si no coincide con gráfico
        if not coincide:
            if not motivo:
                return Response({'error': 'Debe ingresar un motivo cuando no coincide con el gráfico'}, status=400)
            estado = 'PENDIENTE_AUTORIZACION'
            obs = motivo
        else:
            estado = 'ABIERTO'
            obs = ''

        reg = RegistroOperativo.objects.create(
            fecha=fecha_hoy,
            rut_trabajador=user,
            lugar_apertura=lugar,
            hora_apertura=hora_apertura_ez,
            inicio_servicio=hora_presentacion,
            hora_cierre='',
            horas_extras=0,
            horas_menos_reposo=0,
            horas_nocturnas=0,
            horas_manejo=0,
            estado=estado,
            observacion_il=obs,
        )
        return Response({
            'id': reg.id,
            'estado': reg.estado,
            'hora_apertura_ez': hora_apertura_ez,
            'hora_presentacion': hora_presentacion,
        })


# ─── CERRAR TURNO ───────────────────────────────────────────────────────────

class CerrarTurnoView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        cargo = (getattr(user, 'cargo', '') or '').upper()
        if cargo not in ('MAQUINISTA', 'AYUDANTE'):
            return Response({'error': 'Solo tripulación puede cerrar turno'}, status=status.HTTP_403_FORBIDDEN)

        fecha_hoy = datetime.date.today().isoformat()
        try:
            reg = RegistroOperativo.objects.get(rut_trabajador=user, fecha=fecha_hoy, hora_cierre='')
        except RegistroOperativo.DoesNotExist:
            return Response({'error': 'No hay turno abierto para hoy'}, status=404)

        hora_cierre      = (request.data.get('hora_cierre') or '').strip()
        coincide_cierre  = request.data.get('coincide_cierre', True)
        motivo_cierre    = (request.data.get('motivo_cierre') or '').strip()
        inicio_manejo    = (request.data.get('inicio_manejo') or '').strip()   # maquinista
        fin_manejo       = (request.data.get('fin_manejo') or '').strip()      # maquinista

        if not hora_cierre:
            return Response({'error': 'hora_cierre es requerido'}, status=400)
        if not coincide_cierre and not motivo_cierre:
            return Response({'error': 'Debe ingresar un motivo cuando no coincide con el gráfico'}, status=400)
        if cargo == 'MAQUINISTA' and (not inicio_manejo or not fin_manejo):
            return Response({'error': 'El maquinista debe indicar inicio y fin de manejo'}, status=400)

        fmt = '%H:%M'
        t_aper   = _parse_hm(reg.hora_apertura)
        t_cierre_dt = _parse_hm(hora_cierre)
        if t_cierre_dt < t_aper:
            t_cierre_dt += datetime.timedelta(days=1)

        # ── Horas extras (jornada desde apertura EZ > 7.5h)
        total_h = _horas_entre(t_aper, t_cierre_dt)
        horas_extras = round(max(total_h - 7.5, 0.0), 2)

        # ── Horas nocturnas (minutos entre presentación y cierre que caen antes de 07:00)
        m_noct = 0
        curr = _parse_hm(reg.inicio_servicio)
        if curr > t_cierre_dt:
            curr -= datetime.timedelta(days=1)
        while curr < t_cierre_dt:
            if curr.hour < 7:
                m_noct += 1
            curr += datetime.timedelta(minutes=1)
        horas_nocturnas = round(m_noct / 60.0, 2)

        # ── Horas de manejo (maquinista): horas conducidas - 5h reglamentarias
        horas_manejo = 0.0
        if cargo == 'MAQUINISTA':
            t_im = _parse_hm(inicio_manejo)
            t_fm = _parse_hm(fin_manejo)
            h_cond = _horas_entre(t_im, t_fm)
            horas_manejo = round(max(h_cond - 5.0, 0.0), 2)

        # ── Horas menos reposo (< 10h desde último cierre)
        horas_menos_reposo = 0.0
        ultimo = RegistroOperativo.objects.filter(
            rut_trabajador=user, hora_cierre__gt=''
        ).exclude(id=reg.id).order_by('-fecha').first()
        if ultimo and ultimo.hora_cierre:
            try:
                dt_ult  = datetime.datetime.combine(ultimo.fecha, datetime.datetime.strptime(ultimo.hora_cierre, fmt).time())
                dt_aper = datetime.datetime.combine(datetime.date.fromisoformat(reg.fecha), datetime.datetime.strptime(reg.hora_apertura, fmt).time())
                if dt_aper < dt_ult:
                    dt_aper += datetime.timedelta(days=1)
                h_reposo = (dt_aper - dt_ult).total_seconds() / 3600
                horas_menos_reposo = round(max(10 - h_reposo, 0.0), 2)
            except Exception:
                pass

        obs_base = reg.observacion_il or ''

        if not coincide_cierre:
            estado_final = 'PENDIENTE_AUTORIZACION'
            obs_final = motivo_cierre
        elif reg.estado == 'PENDIENTE_AUTORIZACION':
            estado_final = 'PENDIENTE_AUTORIZACION'
            obs_final = obs_base
        else:
            estado_final = 'CONFIRMADO'
            obs_final = obs_base

        reg.hora_cierre = hora_cierre
        reg.horas_extras = horas_extras
        reg.horas_nocturnas = horas_nocturnas
        reg.horas_manejo = horas_manejo
        reg.horas_menos_reposo = horas_menos_reposo
        reg.estado = estado_final
        reg.observacion_il = obs_final
        reg.save()

        return Response({
            'id': reg.id,
            'estado': reg.estado,
            'horas_extras': horas_extras,
            'horas_nocturnas': horas_nocturnas,
            'horas_manejo': horas_manejo,
            'horas_menos_reposo': horas_menos_reposo,
        })


# ─── MI ASISTENCIA HOY ──────────────────────────────────────────────────────

class MiAsistenciaView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fecha = request.query_params.get('fecha', datetime.date.today().isoformat())
        try:
            reg = RegistroOperativo.objects.get(rut_trabajador=request.user, fecha=fecha)
            return Response(RegistroOperativoSerializer(reg).data)
        except RegistroOperativo.DoesNotExist:
            return Response(None)


# ─── PENDIENTES AUTORIZACIÓN ────────────────────────────────────────────────

class PendientesAutorizacionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cargo = (getattr(request.user, 'cargo', '') or '').upper()
        if cargo not in ROLES_JEFATURA:
            return Response({'error': 'Sin permisos'}, status=403)
        pendientes = RegistroOperativo.objects.filter(
            estado='PENDIENTE_AUTORIZACION'
        ).select_related('rut_trabajador').order_by('-fecha')
        data = []
        for r in pendientes:
            data.append({
                'id': r.id,
                'fecha': str(r.fecha),
                'rut': r.rut_trabajador.rut,
                'nombre': f"{r.rut_trabajador.nombre} {r.rut_trabajador.apellido}".strip(),
                'cargo': r.rut_trabajador.cargo,
                'lugar_apertura': r.lugar_apertura,
                'hora_apertura': r.hora_apertura,
                'inicio_servicio': r.inicio_servicio,
                'hora_cierre': r.hora_cierre,
                'observacion': r.observacion_il,
                'horas_extras': r.horas_extras,
                'horas_nocturnas': r.horas_nocturnas,
                'horas_manejo': r.horas_manejo,
                'horas_menos_reposo': r.horas_menos_reposo,
            })
        return Response(data)

    def post(self, request):
        """Autorizar o rechazar: { id, accion: 'autorizar'|'rechazar' }"""
        cargo = (getattr(request.user, 'cargo', '') or '').upper()
        if cargo not in ROLES_JEFATURA:
            return Response({'error': 'Sin permisos'}, status=403)
        reg_id = request.data.get('id')
        accion = request.data.get('accion', '')
        try:
            reg = RegistroOperativo.objects.get(id=reg_id)
        except RegistroOperativo.DoesNotExist:
            return Response({'error': 'Registro no encontrado'}, status=404)
        nombre_il = f"{request.user.nombre} {request.user.apellido}".strip()
        if accion == 'autorizar':
            reg.estado = 'CONFIRMADO'
            reg.observacion_il = f"{reg.observacion_il} [Autorizado por {nombre_il}]".strip()
        elif accion == 'rechazar':
            reg.estado = 'RECHAZADO'
            reg.observacion_il = f"{reg.observacion_il} [Rechazado por {nombre_il}]".strip()
        else:
            return Response({'error': 'accion debe ser autorizar o rechazar'}, status=400)
        reg.save()
        return Response({'ok': True, 'estado': reg.estado})


# ─── CONSOLIDADO ASISTENCIA ─────────────────────────────────────────────────

class ConsolidadoAsistenciaView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cargo = (getattr(request.user, 'cargo', '') or '').upper()
        if cargo not in ROLES_JEFATURA | {'JEFE SERVICIO', 'JEFE DE SERVICIO'}:
            return Response({'error': 'Sin permisos'}, status=403)
        fecha_desde = request.query_params.get('desde')
        fecha_hasta = request.query_params.get('hasta')
        rut_filtro = request.query_params.get('rut')
        qs = RegistroOperativo.objects.select_related('rut_trabajador').order_by('-fecha')
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)
        if rut_filtro:
            qs = qs.filter(rut_trabajador__rut=rut_filtro)
        data = []
        for r in qs:
            data.append({
                'id': r.id,
                'fecha': str(r.fecha),
                'rut': r.rut_trabajador.rut,
                'nombre': f"{r.rut_trabajador.nombre} {r.rut_trabajador.apellido}".strip(),
                'cargo': r.rut_trabajador.cargo,
                'lugar_apertura': r.lugar_apertura,
                'hora_apertura': r.hora_apertura,
                'inicio_servicio': r.inicio_servicio,
                'hora_cierre': r.hora_cierre,
                'horas_extras': r.horas_extras,
                'horas_manejo': r.horas_manejo,
                'horas_nocturnas': r.horas_nocturnas,
                'horas_menos_reposo': r.horas_menos_reposo,
                'estado': r.estado,
                'observacion': r.observacion_il,
            })
        return Response(data)


# ─── EDITAR HORAS ───────────────────────────────────────────────────────────

class EditarHorasAsistenciaView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        cargo = (getattr(request.user, 'cargo', '') or '').upper()
        if cargo not in ROLES_JEFATURA:
            return Response({'error': 'Sin permisos'}, status=403)
        try:
            reg = RegistroOperativo.objects.get(pk=pk)
        except RegistroOperativo.DoesNotExist:
            return Response({'error': 'Registro no encontrado'}, status=404)
        for field in ('horas_extras', 'horas_manejo', 'horas_nocturnas', 'horas_menos_reposo',
                      'hora_apertura', 'hora_cierre', 'inicio_servicio', 'estado', 'observacion_il'):
            if field in request.data:
                setattr(reg, field, request.data[field])
        reg.save()
        return Response(RegistroOperativoSerializer(reg).data)
