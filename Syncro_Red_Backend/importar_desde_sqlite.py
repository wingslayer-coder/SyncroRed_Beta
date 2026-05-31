"""
Script para importar datos desde la base de datos SQLite del proyecto Streamlit
hacia la base de datos PostgreSQL configurada en Django.

Uso:
    python importar_desde_sqlite.py
"""
import os
import sys
import sqlite3
from datetime import datetime, date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'efe_sur.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from apps.usuarios.models import Usuario, RegistroOperativo, AusenciaTemporal
from apps.operaciones.models import ServicioActivo, ServicioHistorico, RegistroEstacion, MaestroTurno, GraficoMensual, ItinerarioEquipo
from apps.alertas.models import Emergencia, Incidencia, FallaEquipo
from apps.bitacora.models import ReporteFinal, NovedadOperativa

SQLITE_DB = r"c:\Users\Benja\Desktop\Syncro_Red\Proyecto_EFE_Sur\sistema.db"


def parse_date(val):
    if not val:
        return None
    try:
        return datetime.strptime(str(val).strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


def parse_datetime(val):
    if not val:
        return None
    try:
        return datetime.fromisoformat(str(val).strip())
    except ValueError:
        try:
            return datetime.strptime(str(val).strip(), "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None


def importar_usuarios(cursor):
    cursor.execute("SELECT rut, clave, nombre, cargo FROM usuarios")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        rut, clave, nombre, cargo = f
        if not rut:
            continue
        # Separar nombre y apellido simple
        partes = (nombre or "").strip().split(" ", 1)
        nombre_first = partes[0]
        apellido = partes[1] if len(partes) > 1 else ""
        obj, created = Usuario.objects.update_or_create(
            rut=str(rut).strip(),
            defaults={
                "nombre": nombre_first,
                "apellido": apellido,
                "cargo": (cargo or "MAQUINISTA").strip().upper(),
            }
        )
        if clave:
            obj.set_password(clave)
            obj.save()
        count += 1
    print(f"  Usuarios importados: {count}")


def importar_servicios_activos(cursor):
    cursor.execute("SELECT fecha, tren_num, equipo_id, maquinista, ayudante, estado, fecha_cierre, latitud, longitud, timestamp_gps FROM servicios_activos")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fecha, tren_num, equipo_id, maquinista, ayudante, estado, fecha_cierre, lat, lon, ts_gps = f
        fecha_dt = parse_date(fecha)
        if not fecha_dt or not tren_num:
            continue
        ServicioActivo.objects.update_or_create(
            fecha=fecha_dt, tren_num=str(tren_num).strip(),
            defaults={
                "equipo_id": str(equipo_id or "").strip(),
                "maquinista": str(maquinista or "").strip(),
                "ayudante": str(ayudante or "").strip(),
                "estado": (estado or "ACTIVO").strip().upper(),
                "fecha_cierre": parse_datetime(fecha_cierre),
                "latitud": lat,
                "longitud": lon,
                "timestamp_gps": parse_datetime(ts_gps),
            }
        )
        count += 1
    print(f"  Servicios activos importados: {count}")


def importar_servicios_historicos(cursor):
    cursor.execute("SELECT fecha, tren_num, equipo_id, maquinista, ayudante, fecha_cierre, estado FROM servicios_historicos")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fecha, tren_num, equipo_id, maquinista, ayudante, fecha_cierre, estado = f
        fecha_dt = parse_date(fecha)
        if not fecha_dt or not tren_num:
            continue
        ServicioHistorico.objects.update_or_create(
            fecha=fecha_dt, tren_num=str(tren_num).strip(),
            defaults={
                "equipo_id": str(equipo_id or "").strip(),
                "maquinista": str(maquinista or "").strip(),
                "ayudante": str(ayudante or "").strip(),
                "fecha_cierre": parse_datetime(fecha_cierre),
                "estado": (estado or "CERRADO").strip().upper(),
            }
        )
        count += 1
    print(f"  Servicios históricos importados: {count}")


def importar_registros_estaciones(cursor):
    cursor.execute("SELECT fecha, tren_num, estacion_id, estado, color, obs, timestamp FROM registros_estaciones")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fecha, tren_num, estacion_id, estado, color, obs, ts = f
        fecha_dt = parse_date(fecha)
        if not fecha_dt or not tren_num or not estacion_id:
            continue
        RegistroEstacion.objects.update_or_create(
            fecha=fecha_dt, tren_num=str(tren_num).strip(), estacion_id=str(estacion_id).strip(),
            defaults={
                "estado": (estado or "SIN MARCAR").strip().upper(),
                "color": str(color or "").strip(),
                "obs": str(obs or "").strip(),
                "timestamp": parse_datetime(ts) or datetime.now(),
            }
        )
        count += 1
    print(f"  Registros de estaciones importados: {count}")


def importar_maestro_turnos(cursor):
    cursor.execute("SELECT num_turno, tipo_dia, apertura_lugar, apertura_hora, presentacion_lugar, presentacion_hora, servicios, cierre_lugar, cierre_hora FROM maestro_turnos")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        num_turno, tipo_dia, apertura_lugar, apertura_hora, presentacion_lugar, presentacion_hora, servicios, cierre_lugar, cierre_hora = f
        if not num_turno or not tipo_dia:
            continue
        MaestroTurno.objects.update_or_create(
            num_turno=str(num_turno).strip(), tipo_dia=str(tipo_dia).strip(),
            defaults={
                "apertura_lugar": str(apertura_lugar or "").strip(),
                "apertura_hora": str(apertura_hora or "").strip(),
                "presentacion_lugar": str(presentacion_lugar or "").strip(),
                "presentacion_hora": str(presentacion_hora or "").strip(),
                "servicios": str(servicios or "").strip(),
                "cierre_lugar": str(cierre_lugar or "").strip(),
                "cierre_hora": str(cierre_hora or "").strip(),
            }
        )
        count += 1
    print(f"  Maestro de turnos importados: {count}")


def importar_grafico_mensual(cursor):
    cursor.execute("SELECT fecha, rut, num_turno FROM grafico_mensual")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fecha, rut, num_turno = f
        fecha_dt = parse_date(fecha)
        if not fecha_dt or not rut:
            continue
        usuario = Usuario.objects.filter(rut=str(rut).strip()).first()
        if not usuario:
            continue
        GraficoMensual.objects.update_or_create(
            fecha=fecha_dt, rut=usuario,
            defaults={"num_turno": str(num_turno or "").strip()}
        )
        count += 1
    print(f"  Gráfico mensual importados: {count}")


def importar_itinerario_equipos(cursor):
    cursor.execute("SELECT fecha, equipo, inicio, servicios_am, destino_medio, servicios_pm, destino_final, destino_final_real, estado, modificado_por, observacion FROM itinerario_equipos")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fecha, equipo, inicio, servicios_am, destino_medio, servicios_pm, destino_final, destino_final_real, estado, modificado_por, observacion = f
        fecha_dt = parse_date(fecha)
        if not fecha_dt or not equipo:
            continue
        ItinerarioEquipo.objects.update_or_create(
            fecha=fecha_dt, equipo=str(equipo).strip(),
            defaults={
                "inicio": str(inicio or "").strip(),
                "servicios_am": str(servicios_am or "").strip(),
                "destino_medio": str(destino_medio or "").strip(),
                "servicios_pm": str(servicios_pm or "").strip(),
                "destino_final": str(destino_final or "").strip(),
                "destino_final_real": str(destino_final_real or "").strip(),
                "estado": (estado or "PLANIFICADO").strip().upper(),
                "modificado_por": str(modificado_por or "").strip(),
                "observacion": str(observacion or "").strip(),
            }
        )
        count += 1
    print(f"  Itinerario de equipos importados: {count}")


def importar_emergencias(cursor):
    cursor.execute("SELECT fecha_hora, tren_num, equipo, maquinista, ayudante, estado_tripulacion, tipo_evento, ubicacion, estado_alerta, latitud, longitud FROM emergencias_activas")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fh, tren_num, equipo, maquinista, ayudante, est_trip, tipo_evento, ubicacion, estado_alerta, lat, lon = f
        Emergencia.objects.create(
            fecha_hora=parse_datetime(fh) or datetime.now(),
            tren_num=str(tren_num or "").strip(),
            equipo=str(equipo or "").strip(),
            maquinista=str(maquinista or "").strip(),
            ayudante=str(ayudante or "").strip(),
            estado_tripulacion=str(est_trip or "").strip(),
            tipo_evento=str(tipo_evento or "").strip(),
            ubicacion=str(ubicacion or "").strip(),
            estado_alerta=(estado_alerta or "ACTIVA").strip().upper(),
            latitud=lat,
            longitud=lon,
        )
        count += 1
    print(f"  Emergencias importadas: {count}")


def importar_incidencias(cursor):
    cursor.execute("SELECT fecha_hora, fecha, tren_num, equipo, maquinista, ayudante, rut_reporta, nombre_reporta, tipo_incidencia, detalle, ubicacion, latitud, longitud, estado FROM incidencias_ferroviarias")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fh, fecha, tren_num, equipo, maquinista, ayudante, rut_reporta, nombre_reporta, tipo_incidencia, detalle, ubicacion, lat, lon, estado = f
        fecha_dt = parse_date(fecha)
        Incidencia.objects.create(
            fecha_hora=parse_datetime(fh) or datetime.now(),
            fecha=fecha_dt or date.today(),
            tren_num=str(tren_num or "").strip(),
            equipo=str(equipo or "").strip(),
            maquinista=str(maquinista or "").strip(),
            ayudante=str(ayudante or "").strip(),
            rut_reporta=str(rut_reporta or "").strip(),
            nombre_reporta=str(nombre_reporta or "").strip(),
            tipo_incidencia=str(tipo_incidencia or "").strip(),
            detalle=str(detalle or "").strip(),
            ubicacion=str(ubicacion or "").strip(),
            latitud=lat,
            longitud=lon,
            estado=(estado or "REGISTRADA").strip().upper(),
        )
        count += 1
    print(f"  Incidencias importadas: {count}")


def importar_fallas(cursor):
    cursor.execute("SELECT fecha_hora, tren_num, equipo, rut_reporta, nombre_reporta, sistema_afectado, detalle, estado FROM fallas_equipos")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fh, tren_num, equipo, rut_reporta, nombre_reporta, sistema_afectado, detalle, estado = f
        FallaEquipo.objects.create(
            fecha_hora=parse_datetime(fh) or datetime.now(),
            tren_num=str(tren_num or "").strip(),
            equipo=str(equipo or "").strip(),
            rut_reporta=str(rut_reporta or "").strip(),
            nombre_reporta=str(nombre_reporta or "").strip(),
            sistema_afectado=str(sistema_afectado or "").strip(),
            detalle=str(detalle or "").strip(),
            estado=(estado or "PENDIENTE").strip().upper(),
        )
        count += 1
    print(f"  Fallas de equipos importadas: {count}")


def importar_ausencias(cursor):
    cursor.execute("SELECT fecha, rut, tipo, motivo, dias, registrado_por FROM ausencias_temporales")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fecha, rut, tipo, motivo, dias, registrado_por = f
        fecha_dt = parse_date(fecha)
        if not fecha_dt or not rut:
            continue
        usuario = Usuario.objects.filter(rut=str(rut).strip()).first()
        if not usuario:
            continue
        AusenciaTemporal.objects.update_or_create(
            fecha=fecha_dt, rut=usuario,
            defaults={
                "tipo": (tipo or "LICENCIA").strip().upper(),
                "motivo": str(motivo or "").strip(),
                "dias": int(dias or 1),
                "registrado_por": str(registrado_por or "").strip(),
            }
        )
        count += 1
    print(f"  Ausencias temporales importadas: {count}")


def importar_registros_operativos(cursor):
    cursor.execute("SELECT fecha, rut_trabajador, lugar_apertura, hora_apertura, inicio_servicio, hora_cierre, horas_extras, horas_menos_reposo, horas_nocturnas, horas_manejo, estado, observacion_il FROM registro_operativo")
    filas = cursor.fetchall()
    count = 0
    for f in filas:
        fecha, rut_trabajador, lugar_apertura, hora_apertura, inicio_servicio, hora_cierre, horas_extras, horas_menos_reposo, horas_nocturnas, horas_manejo, estado, observacion_il = f
        fecha_dt = parse_date(fecha)
        if not fecha_dt or not rut_trabajador:
            continue
        usuario = Usuario.objects.filter(rut=str(rut_trabajador).strip()).first()
        if not usuario:
            continue
        RegistroOperativo.objects.update_or_create(
            fecha=fecha_dt, rut_trabajador=usuario,
            defaults={
                "lugar_apertura": str(lugar_apertura or "").strip(),
                "hora_apertura": str(hora_apertura or "").strip(),
                "inicio_servicio": str(inicio_servicio or "").strip(),
                "hora_cierre": str(hora_cierre or "").strip(),
                "horas_extras": float(horas_extras or 0),
                "horas_menos_reposo": float(horas_menos_reposo or 0),
                "horas_nocturnas": float(horas_nocturnas or 0),
                "horas_manejo": float(horas_manejo or 0),
                "estado": (estado or "PENDIENTE").strip().upper(),
                "observacion_il": str(observacion_il or "").strip(),
            }
        )
        count += 1
    print(f"  Registros operativos importados: {count}")


def main():
    if not os.path.exists(SQLITE_DB):
        print(f"ERROR: No se encontró la base de datos SQLite: {SQLITE_DB}")
        sys.exit(1)

    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()

    print("Iniciando importación desde SQLite a PostgreSQL...")

    importar_usuarios(cursor)
    importar_servicios_activos(cursor)
    importar_servicios_historicos(cursor)
    importar_registros_estaciones(cursor)
    importar_maestro_turnos(cursor)
    importar_grafico_mensual(cursor)
    importar_itinerario_equipos(cursor)
    importar_emergencias(cursor)
    importar_incidencias(cursor)
    importar_fallas(cursor)
    importar_ausencias(cursor)
    importar_registros_operativos(cursor)

    conn.close()
    print("\nImportación completada exitosamente.")


if __name__ == "__main__":
    main()
