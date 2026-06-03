"""Generador automático del gráfico mensual de turnos.

Dado el conjunto de parejas fijas (maquinista+ayudante) registradas y un mes,
calcula el gráfico completo aplicando:

  REGLAS DURAS (siempre):
    - Cobertura 100% de los turnos de cada día.
    - Sin "menos reposo": dentro de un bloque de trabajo la hora de entrada nunca
      retrocede ⇒ reposo entre turnos ~16 h. La entrada solo se resetea tras un descanso.

  REGLAS BLANDAS (best-effort, se reportan):
    - Máximo 6 días seguidos (descansa primero a los más cansados).
    - Mixto por semana (banda mañana/tarde alterna y escalonada).
    - Tras el descanso se tiende a entrar tarde.

Soporta feriados (turnos 'FER') y arrastra el estado del final del mes anterior
para dar continuidad perfecta entre meses. Es determinista: misma tripulación +
mes ⇒ mismo gráfico, por lo que sirve para cualquier mes futuro.
"""

import calendar
import datetime

from django.db import transaction
from django.db.models import Q

from apps.usuarios.recomendacion import hm_valido
from .models import GraficoMensual, MaestroTurno, ParejaTripulacion, Feriado

MAX_SEGUIDOS = 6


def _ap_min(s):
    s = (s or '').strip()
    if not hm_valido(s):
        return None
    h, m = s.split(':')
    return int(h) * 60 + int(m)


def tipo_dia_fecha(d, feriados):
    if d in feriados:
        return 'FER'
    wd = d.isoweekday()
    return 'DOM' if wd == 7 else 'SAB' if wd == 6 else 'LV'


def _turnos_dia(td, cache):
    if td in cache:
        return cache[td]
    out = []
    for mt in MaestroTurno.objects.filter(tipo_dia=td):
        serv = (mt.servicios or '').upper()
        if 'DESCANSO' in serv:
            continue
        ap = _ap_min(mt.apertura_hora) if mt.apertura_hora else _ap_min(mt.presentacion_hora)
        if ap is None or not hm_valido(mt.cierre_hora):
            continue
        out.append({'num': mt.num_turno.strip(), 'ap': ap})
    cache[td] = out
    return out


def _asignar_dia(turnos, estado, week, rep):
    """Asigna los turnos del día a las parejas. Devuelve {idx: num ('' si libre)}, {num: ap}."""
    P = len(estado)
    M = len(turnos)
    ap_de = {t['num']: t['ap'] for t in turnos}

    orden = sorted(range(P), key=lambda i: (-estado[i]['consec'], -(estado[i]['ult_ap'] or -1)))
    descansan = set(orden[:max(0, P - M)])
    trabajan = [i for i in range(P) if i not in descansan]

    asign, usados = {}, set()

    # 1) Continúan (trabajaron ayer): exigen apertura >= última (sin menos-reposo).
    cont = sorted([i for i in trabajan if estado[i]['ult_ap'] is not None],
                  key=lambda i: -estado[i]['ult_ap'])
    fresh = [i for i in trabajan if estado[i]['ult_ap'] is None]
    for t in sorted(turnos, key=lambda t: -t['ap']):
        for i in cont:
            if i in usados:
                continue
            if estado[i]['ult_ap'] <= t['ap']:
                asign[t['num']] = i
                usados.add(i)
                break

    # 2) Frescas: turnos restantes, preferir banda mixta (desc => entra tarde).
    for t in sorted([t for t in turnos if t['num'] not in asign], key=lambda t: -t['ap']):
        es_am = t['ap'] < 12 * 60
        cand = [i for i in fresh if i not in usados]
        if cand:
            elegido = min(cand, key=lambda i: 0 if (((i + week) % 2 == 0) == es_am) else 1)
            asign[t['num']] = elegido
            usados.add(elegido)

    # 3) Cobertura: rescatar sin generar nunca menos-reposo.
    sin_cubrir = [t for t in turnos if t['num'] not in asign]
    if sin_cubrir:
        pool = [i for i in trabajan if i not in usados]
        pool += sorted(descansan, key=lambda i: estado[i]['consec'])
        for t in sorted(sin_cubrir, key=lambda t: -t['ap']):
            for i in pool:
                if i in usados:
                    continue
                if estado[i]['ult_ap'] is not None and estado[i]['ult_ap'] > t['ap']:
                    continue
                asign[t['num']] = i
                usados.add(i)
                break

    rep['cubiertos'] += len(asign)
    rep['turnos'] += M
    if len(asign) < M:
        rep['sin_cobertura'] += 1

    resultado = {i: '' for i in range(P)}
    for num, i in asign.items():
        resultado[i] = num
    return resultado, ap_de


def _estado_inicial(anio, mes, pares, feriados):
    """Arrastra el estado (días seguidos + última apertura) desde el final del mes anterior.
    Si no hay historia previa, escalona el conteo para no sincronizar los descansos."""
    primero = datetime.date(anio, mes, 1)
    cache = {}
    estado = []
    for idx, p in enumerate(pares):
        rut = p.maquinista_id or p.ayudante_id
        consec, ult, hubo_historia = 0, None, False
        if rut:
            dd = primero - datetime.timedelta(days=1)
            seq = []
            for _ in range(8):
                g = GraficoMensual.objects.filter(rut=rut, fecha=dd).first()
                if g and g.num_turno.strip():
                    seq.append((dd, g.num_turno.strip()))
                    dd -= datetime.timedelta(days=1)
                else:
                    break
            if seq:
                hubo_historia = True
                consec = len(seq)
                flast, nlast = seq[0]
                td = tipo_dia_fecha(flast, feriados)
                mt = MaestroTurno.objects.filter(num_turno=nlast, tipo_dia=td).first()
                if mt:
                    ult = _ap_min(mt.apertura_hora) if mt.apertura_hora else _ap_min(mt.presentacion_hora)
        if not hubo_historia:
            consec = idx % 7  # escalonar el primer mes
        estado.append({'consec': consec, 'ult_ap': ult})
    return estado


@transaction.atomic
def generar_mes(anio, mes):
    """Genera y persiste el gráfico del mes. Devuelve un reporte con métricas."""
    pares = list(ParejaTripulacion.objects.filter(activa=True).order_by('orden'))
    if not pares:
        return {'ok': False, 'error': 'No hay parejas definidas. Crea/auto-empareja la tripulación primero.'}

    feriados = set(Feriado.objects.filter(fecha__year=anio, fecha__month=mes).values_list('fecha', flat=True))

    # Limpiar el mes para toda la tripulación (las parejas viven en ParejaTripulacion, se conservan)
    GraficoMensual.objects.filter(fecha__year=anio, fecha__month=mes).filter(
        Q(rut__cargo__icontains='MAQUINISTA') | Q(rut__cargo__icontains='AYUDANTE')
    ).delete()

    estado = _estado_inicial(anio, mes, pares, feriados)
    P = len(pares)
    run = [0] * P
    rep = {'cubiertos': 0, 'turnos': 0, 'libres': 0, 'menos_reposo': 0,
           'sin_cobertura': 0, 'max_consec': [0] * P}
    cache_turnos = {}
    dias_mes = calendar.monthrange(anio, mes)[1]

    for dia in range(1, dias_mes + 1):
        d = datetime.date(anio, mes, dia)
        td = tipo_dia_fecha(d, feriados)
        turnos = _turnos_dia(td, cache_turnos)
        asign, ap_de = _asignar_dia(turnos, estado, (dia - 1) // 7, rep)

        for i, p in enumerate(pares):
            num = asign[i]
            for rut in (p.maquinista_id, p.ayudante_id):
                if rut:
                    GraficoMensual.objects.update_or_create(
                        fecha=d, rut_id=rut, defaults={'num_turno': num})
            if num == '':
                estado[i]['consec'] = 0
                estado[i]['ult_ap'] = None
                run[i] = 0
                rep['libres'] += 1
            else:
                ap = ap_de[num]
                if estado[i]['ult_ap'] is not None and ap < estado[i]['ult_ap']:
                    rep['menos_reposo'] += 1
                estado[i]['consec'] += 1
                estado[i]['ult_ap'] = ap
                run[i] += 1
                rep['max_consec'][i] = max(rep['max_consec'][i], run[i])

    cobertura = round(100.0 * rep['cubiertos'] / rep['turnos'], 1) if rep['turnos'] else 0
    return {
        'ok': True,
        'anio': anio, 'mes': mes,
        'parejas': P,
        'cobertura_pct': cobertura,
        'turnos_totales': rep['turnos'],
        'turnos_cubiertos': rep['cubiertos'],
        'menos_reposo': rep['menos_reposo'],
        'dias_sin_cobertura_total': rep['sin_cobertura'],
        'libres_promedio_pareja': round(rep['libres'] / P, 1) if P else 0,
        'max_dias_seguidos': max(rep['max_consec']) if P else 0,
        'parejas_superan_6': sum(1 for c in rep['max_consec'] if c > MAX_SEGUIDOS),
        'feriados_en_mes': sorted(str(f) for f in feriados),
    }


def auto_emparejar():
    """Crea parejas para maquinistas/ayudantes activos aún sin pareja (por orden de RUT)."""
    from apps.usuarios.models import Usuario
    en_uso_mq = set(ParejaTripulacion.objects.exclude(maquinista__isnull=True).values_list('maquinista_id', flat=True))
    en_uso_ay = set(ParejaTripulacion.objects.exclude(ayudante__isnull=True).values_list('ayudante_id', flat=True))
    mqs = list(Usuario.objects.filter(is_active=True, cargo__icontains='MAQUINISTA')
               .exclude(rut__in=en_uso_mq).order_by('rut'))
    ays = list(Usuario.objects.filter(is_active=True, cargo__icontains='AYUDANTE')
               .exclude(rut__in=en_uso_ay).order_by('rut'))
    siguiente = (ParejaTripulacion.objects.order_by('-orden').values_list('orden', flat=True).first() or 0) + 1
    creadas = 0
    for k in range(max(len(mqs), len(ays))):
        ParejaTripulacion.objects.create(
            orden=siguiente + k,
            maquinista=mqs[k] if k < len(mqs) else None,
            ayudante=ays[k] if k < len(ays) else None,
            activa=True,
        )
        creadas += 1
    return creadas
