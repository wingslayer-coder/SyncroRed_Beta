"""Importadores reutilizables (usados por comandos de management y por los botones de carga del admin)."""

import csv
import io
import calendar
import datetime

CAMPOS_MAESTRO = ['num_turno', 'tipo_dia', 'apertura_lugar', 'apertura_hora',
                  'presentacion_lugar', 'presentacion_hora', 'servicios', 'cierre_lugar', 'cierre_hora']


def _decodificar(file_obj):
    raw = file_obj.read()
    if isinstance(raw, bytes):
        for enc in ('utf-8-sig', 'utf-8', 'latin-1'):
            try:
                return raw.decode(enc)
            except UnicodeDecodeError:
                continue
        return raw.decode('utf-8', errors='replace')
    return raw


def _norm_hora(s):
    s = (s or '').strip()
    if not s or s == '-':
        return ''
    if ':' not in s:
        return s
    h, m = s.split(':', 1)
    return f'{h.strip().zfill(2)}:{m.strip().zfill(2)}'


def _norm_txt(s):
    s = (s or '').strip()
    return '' if s == '-' else s


def importar_maestro_turnos(file_obj):
    """Carga/corrige el Maestro de Turnos desde un CSV (separador ';').
    Hace upsert por (num_turno, tipo_dia) y elimina los turnos que ya no están en el CSV."""
    from .models import MaestroTurno

    contenido = _decodificar(file_obj)
    reader = csv.DictReader(io.StringIO(contenido), delimiter=';')
    faltan = [c for c in CAMPOS_MAESTRO if c not in (reader.fieldnames or [])]
    if faltan:
        raise ValueError(f'El CSV no tiene las columnas esperadas. Faltan: {faltan}')

    creados = actualizados = 0
    claves, tipos = set(), set()
    for fila in reader:
        num = (fila['num_turno'] or '').strip()
        tipo = (fila['tipo_dia'] or '').strip().upper()
        if not num or not tipo:
            continue
        claves.add((num, tipo))
        tipos.add(tipo)
        _, was_created = MaestroTurno.objects.update_or_create(
            num_turno=num, tipo_dia=tipo,
            defaults={
                'apertura_lugar': _norm_txt(fila['apertura_lugar']),
                'apertura_hora': _norm_hora(fila['apertura_hora']),
                'presentacion_lugar': _norm_txt(fila['presentacion_lugar']),
                'presentacion_hora': _norm_hora(fila['presentacion_hora']),
                'servicios': _norm_txt(fila['servicios']),
                'cierre_lugar': _norm_txt(fila['cierre_lugar']),
                'cierre_hora': _norm_hora(fila['cierre_hora']),
            },
        )
        creados += was_created
        actualizados += (not was_created)

    eliminados = 0
    for mt in MaestroTurno.objects.filter(tipo_dia__in=tipos):
        if (mt.num_turno.strip(), mt.tipo_dia.strip().upper()) not in claves:
            mt.delete()
            eliminados += 1

    return {'creados': creados, 'actualizados': actualizados, 'eliminados': eliminados, 'tipos': sorted(tipos)}


def importar_grafico_csv(file_obj, anio, mes):
    """Carga manual del gráfico mensual desde un CSV tipo grilla.
    Encabezado: RUT;1;2;3;...;31  (celda = nº de turno; vacío = libre).
    Reemplaza el mes solo para los RUT presentes en el archivo."""
    from .models import GraficoMensual
    from apps.usuarios.models import Usuario

    contenido = _decodificar(file_obj)
    rows = list(csv.reader(io.StringIO(contenido), delimiter=';'))
    if not rows:
        raise ValueError('El CSV está vacío')

    header = rows[0]
    rut_col = 0
    for i, c in enumerate(header):
        if (c or '').strip().upper() in ('RUT', 'TRABAJADOR'):
            rut_col = i
            break

    dias_mes = calendar.monthrange(anio, mes)[1]
    day_cols = {}
    for i, c in enumerate(header):
        cc = (c or '').strip()
        if cc.isdigit() and 1 <= int(cc) <= dias_mes:
            day_cols[i] = int(cc)
    if not day_cols:
        raise ValueError('El encabezado no tiene columnas de día (1..31). Usa: RUT;1;2;3;...')

    ruts_validos = set(Usuario.objects.values_list('rut', flat=True))
    csv_ruts, asignaciones, desconocidos = [], [], set()
    for row in rows[1:]:
        if rut_col >= len(row):
            continue
        rut = (row[rut_col] or '').strip()
        if not rut:
            continue
        if rut not in ruts_validos:
            desconocidos.add(rut)
            continue
        csv_ruts.append(rut)
        for i, day in day_cols.items():
            val = (row[i] or '').strip() if i < len(row) else ''
            asignaciones.append((datetime.date(anio, mes, day), rut, val))

    GraficoMensual.objects.filter(fecha__year=anio, fecha__month=mes, rut__rut__in=csv_ruts).delete()
    GraficoMensual.objects.bulk_create(
        [GraficoMensual(fecha=f, rut_id=r, num_turno=v) for (f, r, v) in asignaciones]
    )
    return {
        'trabajadores': len(set(csv_ruts)),
        'asignaciones': len(asignaciones),
        'dias': len(day_cols),
        'desconocidos': sorted(desconocidos),
    }


def importar_tripulacion(file_obj):
    """Carga la tripulación desde un CSV 'RUT;CLAVE;NOMBRE;CARGO'.
    Crea/actualiza usuarios; la clave del CSV se usa como contraseña."""
    from apps.usuarios.models import Usuario

    contenido = _decodificar(file_obj)
    reader = csv.DictReader(io.StringIO(contenido), delimiter=';')
    cols = {c.upper(): c for c in (reader.fieldnames or [])}
    for req in ('RUT', 'NOMBRE', 'CARGO'):
        if req not in cols:
            raise ValueError("El CSV debe tener columnas: RUT;CLAVE;NOMBRE;CARGO")

    creados = actualizados = 0
    for fila in reader:
        rut = (fila[cols['RUT']] or '').strip()
        if not rut:
            continue
        nombre_full = (fila[cols['NOMBRE']] or '').strip()
        partes = nombre_full.split()
        nombre = partes[0] if partes else nombre_full
        apellido = ' '.join(partes[1:]) if len(partes) > 1 else ''
        cargo = (fila[cols['CARGO']] or '').strip().upper()
        clave = (fila[cols['CLAVE']] or '').strip() if 'CLAVE' in cols else ''

        u = Usuario.objects.filter(rut=rut).first()
        if u:
            u.nombre, u.apellido, u.cargo, u.is_active = nombre, apellido, cargo, True
            if clave:
                u.set_password(clave)
            u.save()
            actualizados += 1
        else:
            u = Usuario.objects.create_user(rut=rut, password=clave or None,
                                            nombre=nombre, apellido=apellido, cargo=cargo)
            u.is_active = True
            u.save()
            creados += 1

    return {'creados': creados, 'actualizados': actualizados}
