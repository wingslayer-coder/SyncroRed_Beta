import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'efe_sur.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.operaciones.models import RutaEstacion, ItinerarioMaestro
from apps.bitacora.datos import RUTAS, TRENES

def importar_rutas():
    print("Importando Rutas...")
    count = 0
    for ruta_id, estaciones in RUTAS.items():
        for orden, nombre in enumerate(estaciones):
            RutaEstacion.objects.update_or_create(
                ruta_id=ruta_id,
                orden=orden,
                defaults={'estacion_nombre': nombre}
            )
            count += 1
    print(f"Rutas importadas: {count} estaciones.")

def importar_trenes():
    print("Importando Itinerarios de Trenes...")
    count = 0
    for tipo_dia, trenes_dia in TRENES.items():
        for tren_num, datos in trenes_dia.items():
            ruta_id = datos.get('ruta')
            horarios = datos.get('horarios', [])
            
            # Recuperar las estaciones de esa ruta
            estaciones_ruta = RUTAS.get(ruta_id, [])
            
            for orden, hora in enumerate(horarios):
                if orden >= len(estaciones_ruta):
                    break
                
                estacion_nombre = estaciones_ruta[orden]
                
                ItinerarioMaestro.objects.update_or_create(
                    tren_num=str(tren_num),
                    tipo_dia=tipo_dia,
                    estacion_nombre=estacion_nombre,
                    defaults={
                        'ruta_id': ruta_id,
                        'orden_estacion': orden,
                        'hora_programada': hora if hora else None
                    }
                )
                count += 1
    print(f"Itinerarios maestros importados: {count} registros.")

if __name__ == "__main__":
    importar_rutas()
    importar_trenes()
    print("¡Importación finalizada con éxito!")
