import logging
from datetime import datetime
from apps.operaciones.models import ServicioActivo, RegistroEstacion
from .datos import TRENES, RUTAS

logger = logging.getLogger(__name__)

def generar_reporte_turno(fecha, usuario_nombre, rol):
    """Genera el texto plano consolidado con las novedades de la jornada en formato Markdown/Texto"""
    reporte = f"Reporte de Servicios\n"
    reporte += f"Fecha de Emisión : {fecha}\n"
    reporte += f"Personal :\n"

    # Buscamos quién operó hoy para armar la tripulación dinámicamente
    tripulacion = ServicioActivo.objects.filter(fecha=fecha).first()

    if tripulacion:
        reporte += f"{tripulacion.maquinista} Maquinista\n"
        reporte += f"{tripulacion.ayudante} Ayudante\n\n"
    else:
        reporte += f"{usuario_nombre} ({rol.title()})\n\n"

    reporte += "📢 NOVEDADES Y ESTADO DE LOS SERVICIOS:"

    try:
        servicios = ServicioActivo.objects.filter(fecha=fecha)
        if not servicios.exists():
            reporte += "\n• No se registran servicios operados en el tablero para esta fecha."
        else:
            if isinstance(fecha, str):
                fecha_dt = datetime.strptime(fecha, "%Y-%m-%d").date()
            else:
                fecha_dt = fecha
                
            dia_semana_num = fecha_dt.weekday()
            dia_clave = "LV" if dia_semana_num < 5 else ("SAB" if dia_semana_num == 5 else "DOM")

            for ser in servicios:
                tren_num_act = str(ser.tren_num).strip()
                equipo_id_act = str(ser.equipo_id)

                servicio_fijo = None
                if tren_num_act in TRENES.get(dia_clave, {}):
                    servicio_fijo = TRENES[dia_clave][tren_num_act]
                else:
                    for d in ["LV", "SAB", "DOM"]:
                        if tren_num_act in TRENES.get(d, {}):
                            servicio_fijo = TRENES[d][tren_num_act]
                            break

                if not servicio_fijo:
                    continue

                estaciones_linea = RUTAS[servicio_fijo["ruta"]]
                horarios_linea = servicio_fijo["horarios"]

                indices_validos = [idx for idx, h in enumerate(horarios_linea) if h is not None]
                if not indices_validos:
                    continue

                idx_origen = indices_validos[0]
                idx_destino = indices_validos[-1]

                filas_est = RegistroEstacion.objects.filter(fecha=fecha, tren_num=tren_num_act)
                registros_tren = {f"{tren_num_act}_{f.estacion_id}": {"estado": f.estado, "obs": f.obs} for f in filas_est}

                id_orig_db = f"{tren_num_act}_{idx_origen}"
                id_dest_db = f"{tren_num_act}_{idx_destino}"

                # --- 1. EVALUACIÓN DE ORIGEN ---
                est_origen_nombre = estaciones_linea[idx_origen]
                reg_origen = registros_tren.get(id_orig_db, {"estado": "A LA HORA", "obs": ""})
                estado_orig_txt = "a Horario" if reg_origen["estado"] == "A LA HORA" else "con Atraso"

                reporte += f"\n\n       🚆 TREN N° {tren_num_act} [Equipo: {equipo_id_act}]\n"
                reporte += f"• Salida desde {est_origen_nombre} {estado_orig_txt}\n"

                # --- 2. EVALUACIÓN DE INTERMEDIAS ---
                for idx in indices_validos[1:-1]:
                    id_inter_db = f"{tren_num_act}_{idx}"
                    if id_inter_db in registros_tren:
                        reg_inter = registros_tren[id_inter_db]
                        if reg_inter["estado"] == "ATRASO":
                            est_inter_nombre = estaciones_linea[idx]
                            motivo_txt = reg_inter["obs"].strip() if reg_inter["obs"] else "Falla operacional / En regulación"
                            reporte += f"• Atraso intermedio en estación {est_inter_nombre} ({motivo_txt})\n"

                # --- 3. EVALUACIÓN DE DESTINO ---
                est_destino_nombre = estaciones_linea[idx_destino]
                reg_destino = registros_tren.get(id_dest_db, {"estado": "A LA HORA", "obs": ""})
                estado_dest_txt = "a Horario" if reg_destino["estado"] == "A LA HORA" else "con Atraso"
                reporte += f"• Llegada a {est_destino_nombre} {estado_dest_txt}"

    except Exception as e:
        logger.error(f"Error generando reporte: {e}")
        reporte += f"\n⚠️ Error al compilar minuta técnica: {str(e)}"

    reporte += f"\n\nFin del reporte técnico.."
    return reporte
