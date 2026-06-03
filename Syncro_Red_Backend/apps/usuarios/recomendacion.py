"""
Motor determinista de recomendación de reemplazos de turno.

Aplica las reglas del despachador ferroviario para estimar el sobretiempo que
generaría que un trabajador cubra un "turno requerido", comparado con su turno
original asignado. Lógica espejo de apps.usuarios.views.CerrarTurnoView.

Reglas de sobretiempo:
  - Regla 1: extensión de salida (mismo inicio, fin posterior) → cobra diferencia de salida.
  - Regla 2: anticipación de entrada (mismo fin, inicio anterior) → cobra diferencia de entrada.
  - Regla 3: inicio antes y fin después → suma ambas diferencias.
  - Regla 4: turno completamente desfasado (sin solape) → cobra la totalidad del requerido.
  - Regla 5: afectación de descanso semanal → tiempo trabajado tras las 00:00 se paga como sobretiempo.
  - Jornada normal = 7.5 h; el exceso es sobretiempo (para trabajadores en día disponible).
"""

import datetime
from datetime import timedelta

BASE = datetime.date(2000, 1, 1)
JORNADA_NORMAL = 7.5


def hm_valido(s):
    try:
        datetime.datetime.strptime((s or '').strip(), '%H:%M')
        return True
    except (ValueError, AttributeError):
        return False


def tipo_dia(d: datetime.date) -> str:
    wd = d.isoweekday()
    if wd == 7:
        return 'DOM'
    if wd == 6:
        return 'SAB'
    return 'LV'


def _intervalo(entrada, salida):
    t_ini = datetime.datetime.combine(BASE, datetime.datetime.strptime(entrada.strip(), '%H:%M').time())
    t_fin = datetime.datetime.combine(BASE, datetime.datetime.strptime(salida.strip(), '%H:%M').time())
    if t_fin <= t_ini:  # cruza medianoche
        t_fin += timedelta(days=1)
    return t_ini, t_fin


def _horas_nocturnas(t_ini, t_fin):
    """Horas trabajadas antes de las 07:00."""
    minutos, cur = 0, t_ini
    while cur < t_fin:
        if cur.hour < 7:
            minutos += 1
        cur += timedelta(minutes=1)
    return round(minutos / 60.0, 2)


def _horas_descanso(t_ini, t_fin):
    """Horas trabajadas tras la medianoche (Regla 5 — afectación de descanso)."""
    medianoche = datetime.datetime.combine(BASE, datetime.time(0, 0)) + timedelta(days=1)
    if t_fin > medianoche:
        return round((t_fin - medianoche).total_seconds() / 3600.0, 2)
    return 0.0


def evaluar(req_entrada, req_salida, orig_entrada, orig_salida, origen_label='su turno'):
    """Evalúa el sobretiempo de que un candidato cubra el turno requerido,
    comparado con su ventana de disponibilidad (recibidor) o su turno asignado.

    `origen_label` describe esa ventana en el texto ('su turno', 'su ventana de recibidor').
    Devuelve dict con horas_extra, horas_nocturnas, horas_descanso, regla y detalle.
    """
    req_ini, req_fin = _intervalo(req_entrada, req_salida)
    noct = _horas_nocturnas(req_ini, req_fin)
    desc = _horas_descanso(req_ini, req_fin)

    orig_ini, orig_fin = _intervalo(orig_entrada, orig_salida)
    cap = origen_label[:1].upper() + origen_label[1:]

    if req_fin <= orig_ini or req_ini >= orig_fin:
        # Regla 4: sin solape → totalidad del requerido
        dur_req = (req_fin - req_ini).total_seconds() / 3600.0
        extra = round(dur_req, 2)
        regla = 'Regla 4: turno desfasado (cobro total)'
        detalle = f'Sin solape con {origen_label} {orig_entrada}–{orig_salida}; se cobra el total ({extra} h).'
    else:
        e_entrada = max(0.0, (orig_ini - req_ini).total_seconds() / 3600.0)
        e_salida = max(0.0, (req_fin - orig_fin).total_seconds() / 3600.0)
        extra = round(e_entrada + e_salida, 2)
        partes = []
        if e_entrada > 0:
            partes.append(f'+{round(e_entrada, 2)} h entrada')
        if e_salida > 0:
            partes.append(f'+{round(e_salida, 2)} h salida')
        if e_entrada > 0 and e_salida > 0:
            regla = 'Regla 3: modificación de entrada y salida'
        elif e_salida > 0:
            regla = 'Regla 1: extensión de salida'
        elif e_entrada > 0:
            regla = 'Regla 2: anticipación de entrada'
        else:
            regla = 'Sin sobretiempo (dentro de su disponibilidad)'
        detalle = f'{cap} {orig_entrada}–{orig_salida}. ' + (', '.join(partes) + ' por exceso de jornada.' if partes else 'cubre dentro de su horario, sin sobretiempo.')

    return {
        'horas_extra': extra,
        'horas_nocturnas': noct,
        'horas_descanso': desc,
        'regla': regla,
        'detalle': detalle,
    }


def score(ev):
    """Menor es mejor: prioriza menos sobretiempo, luego descanso afectado y nocturnas."""
    return ev['horas_extra'] + ev['horas_descanso'] + 0.25 * ev['horas_nocturnas']
