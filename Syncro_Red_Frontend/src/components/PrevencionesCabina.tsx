import { useEffect, useState } from 'react';
import client from '../api/client';
import { useUbicacionContinua, distanciaMetros } from '../utils/geo';
import { AlertTriangle, MapPin, Clock, Gauge, TrainTrack } from 'lucide-react';

interface Prevencion {
  id: number;
  linea: string;
  bloque_afectado: string;
  tramo_desde: string;
  tramo_hasta: string;
  via: string;
  km_inicio: string;
  km_fin: string;
  tipo_restriccion: string;
  velocidad_restriccion: string;
  descripcion_trabajo: string;
  causa: string;
  hora_inicio: string;
  hora_termino: string;
  latitud: number | null;
  longitud: number | null;
}

type Estado = 'ACTIVA' | 'PROXIMA' | 'FINALIZADA' | 'PROGRAMADA';

const PROXIMIDAD_M = 1500; // dentro de este radio se considera "en el tramo"

function aMin(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || '').trim());
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : null;
}

function evaluarEstado(p: Prevencion, ahoraMin: number): { estado: Estado; detalle: string } {
  const ini = aMin(p.hora_inicio);
  let fin = aMin(p.hora_termino);
  if (ini == null || fin == null) return { estado: 'PROGRAMADA', detalle: 'Sin horario definido' };
  if (fin < ini) fin += 1440; // cruza medianoche
  const ahora = ahoraMin < ini ? ahoraMin : ahoraMin; // referencia simple del día
  if (ahora < ini) {
    const faltan = ini - ahora;
    return { estado: 'PROXIMA', detalle: `Inicia en ${Math.floor(faltan / 60)}h ${faltan % 60}m` };
  }
  if (ahora <= fin) {
    const restan = fin - ahora;
    return { estado: 'ACTIVA', detalle: `Termina en ${Math.floor(restan / 60)}h ${restan % 60}m` };
  }
  return { estado: 'FINALIZADA', detalle: 'Faena finalizada' };
}

const ESTADO_STYLE: Record<Estado, { card: string; chip: string; label: string }> = {
  ACTIVA: { card: 'border-rojo bg-rojo/5', chip: 'bg-rojo text-white', label: 'ACTIVA' },
  PROXIMA: { card: 'border-amber-400 bg-amber-50', chip: 'bg-amber-500 text-white', label: 'PRÓXIMA' },
  PROGRAMADA: { card: 'border-gray-300 bg-white', chip: 'bg-gray-400 text-white', label: 'PROGRAMADA' },
  FINALIZADA: { card: 'border-gray-200 bg-gray-50 opacity-60', chip: 'bg-gray-300 text-gray-700', label: 'FINALIZADA' },
};

export default function PrevencionesCabina() {
  const [prevenciones, setPrevenciones] = useState<Prevencion[]>([]);
  const [ahora, setAhora] = useState(new Date());
  const { coords, error } = useUbicacionContinua();

  useEffect(() => {
    const fetch = () => client.get('/prevenciones/prevenciones/?activas=1')
      .then(r => setPrevenciones(r.data.results || r.data))
      .catch(() => {});
    fetch();
    const poll = setInterval(fetch, 60000);
    const tick = setInterval(() => setAhora(new Date()), 30000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, []);

  if (prevenciones.length === 0) return null;

  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();

  const items = prevenciones.map(p => {
    const { estado, detalle } = evaluarEstado(p, ahoraMin);
    let distancia: number | null = null;
    if (coords && p.latitud != null && p.longitud != null) {
      distancia = distanciaMetros(coords, { lat: p.latitud, lon: p.longitud });
    }
    return { p, estado, detalle, distancia, enTramo: distancia != null && distancia <= PROXIMIDAD_M };
  });

  // Orden: activas y cercanas primero; finalizadas al final
  const peso: Record<Estado, number> = { ACTIVA: 0, PROXIMA: 1, PROGRAMADA: 2, FINALIZADA: 3 };
  items.sort((a, b) =>
    peso[a.estado] - peso[b.estado] ||
    ((a.distancia ?? Infinity) - (b.distancia ?? Infinity))
  );

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <TrainTrack className="h-5 w-5 text-rojo" />
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-azul">Prevenciones de Vía</h3>
        <span className="rounded-full bg-rojo/10 px-2 py-0.5 text-xs font-bold text-rojo">{prevenciones.length}</span>
        <span className={`ml-auto flex items-center gap-1 text-xs font-semibold ${coords ? 'text-green-600' : 'text-gray-400'}`}>
          <MapPin className="h-3.5 w-3.5" /> {coords ? 'GPS activo' : (error ? 'GPS no disponible' : 'Buscando GPS…')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map(({ p, estado, detalle, distancia, enTramo }) => {
          const st = ESTADO_STYLE[estado];
          return (
            <div key={p.id} className={`rounded-xl border-2 p-4 shadow-sm ${st.card} ${enTramo && estado === 'ACTIVA' ? 'ring-2 ring-rojo ring-offset-1' : ''}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded-md bg-azul px-2 py-0.5 text-xs font-extrabold text-white">{p.linea || '—'}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-extrabold ${st.chip}`}>{st.label}</span>
              </div>

              <div className="mb-1 text-base font-extrabold leading-tight text-gray-900">
                {p.bloque_afectado || `${p.tramo_desde} → ${p.tramo_hasta}`}
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                {p.via && <span className="rounded bg-azul/10 px-2 py-1 text-azul">{p.via}</span>}
                {(p.km_inicio || p.km_fin) && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{p.km_inicio} {p.km_fin ? `– ${p.km_fin}` : ''}</span>
                )}
              </div>

              {(p.tipo_restriccion || p.velocidad_restriccion) && (
                <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-rojo/10 px-2.5 py-1.5 text-sm font-extrabold text-rojo">
                  <Gauge className="h-4 w-4 flex-shrink-0" />
                  {p.tipo_restriccion || p.velocidad_restriccion}
                </div>
              )}

              {(p.descripcion_trabajo || p.causa) && (
                <p className="mb-2 text-xs text-gray-600">{p.descripcion_trabajo || p.causa}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2 text-xs">
                <span className="flex items-center gap-1 font-bold text-gray-700">
                  <Clock className="h-3.5 w-3.5" /> {p.hora_inicio || '—'} – {p.hora_termino || '—'}
                </span>
                <span className="text-gray-500">{detalle}</span>
              </div>

              {distancia != null && (
                <div className={`mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ${enTramo ? 'bg-rojo text-white animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                  <AlertTriangle className="h-4 w-4" />
                  {enTramo ? '¡ESTÁS EN EL TRAMO DE LA FAENA!' : `A ${(distancia / 1000).toFixed(1)} km`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
