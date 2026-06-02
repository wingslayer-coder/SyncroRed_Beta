import { useEffect, useState, useRef } from 'react';
import client from '../api/client';
import type { EventoMapa } from '../types';
import { AlertTriangle, MapPin, CheckCircle, Train, Activity, RefreshCw, Clock } from 'lucide-react';

interface ServicioActivo {
  id: number;
  fecha: string;
  tren_num: string;
  equipo_id: string;
  maquinista: string;
  ayudante: string;
  estado: string;
}

interface Pasada {
  estacion: string;
  estado: string;       // 'A LA HORA' | 'ATRASO' | 'SIN MARCAR'
  minutos_atraso: number;
  timestamp: string | null;
}

export default function JefeServicio() {
  const [eventos, setEventos] = useState<EventoMapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicios, setServicios] = useState<ServicioActivo[]>([]);
  const [pasadasMap, setPasadasMap] = useState<Record<number, Pasada[]>>({});
  const [expandido, setExpandido] = useState<number | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoy = new Date().toISOString().split('T')[0];
  const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const cargarPasadas = (srv: ServicioActivo) => {
    client.get(`/operaciones/servicios-activos/${srv.id}/pasadas/`)
      .then(res => {
        setPasadasMap(prev => ({ ...prev, [srv.id]: res.data.pasadas }));
      }).catch(() => {});
  };

  const cargarServicios = () => {
    client.get(`/operaciones/servicios-activos/?fecha=${hoy}`)
      .then(res => {
        const lista: ServicioActivo[] = res.data.results ?? res.data;
        setServicios(lista);
        setUltimaActualizacion(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        lista.forEach(cargarPasadas);
      })
      .catch(() => {});
  };

  useEffect(() => {
    client.get(`/operaciones/eventos-mapa/?fecha_desde=${ayer}&fecha_hasta=${hoy}`)
      .then((res) => setEventos(res.data.eventos))
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));

    cargarServicios();
    intervalRef.current = setInterval(cargarServicios, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const incidencias = eventos.filter((e) => e.tipo === 'Incidencia');
  const emergencias = eventos.filter((e) => e.tipo === 'Emergencia');
  const totalAlertas = emergencias.length + incidencias.length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azul/10">
            <Activity className="h-6 w-6 text-rojo" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-azul leading-tight">Consola de Control de Tráfico</h2>
            <p className="text-sm text-gray-400">Monitoreo operacional en tiempo real</p>
          </div>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
          {new Date().toLocaleDateString('es-CL')} · {new Date().toLocaleTimeString('es-CL')}
        </span>
      </div>

      {/* Banner de alertas */}
      {totalAlertas > 0 && (
        <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white p-4">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rojo text-white">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold text-rojo">{totalAlertas} alerta(s) activa(s) en la red</div>
            <div className="text-xs text-red-500">
              {emergencias.length} emergencia(s) · {incidencias.length} incidencia(s)
            </div>
          </div>
        </div>
      )}

      {/* Emergencias */}
      {emergencias.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-bold text-rojo">
            <AlertTriangle className="h-4 w-4" /> Emergencias Activas
          </h3>
          {emergencias.map((em, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
              <div className="h-1 w-full bg-rojo" />
              <div className="flex items-start justify-between p-4">
                <div className="space-y-1">
                  <div className="font-bold text-rojo">
                    {em.evento} — Tren {em.tren} ({em.equipo})
                  </div>
                  <div className="text-sm text-gray-600">
                    <b>Hora:</b> {em.fecha_hora} | <b>Ubicación:</b> {em.ubicacion}
                  </div>
                  <div className="text-sm text-gray-600">
                    <b>Tripulación:</b> Maq. {em.maquinista} | Ayu. {em.ayudante}
                  </div>
                  {em.lat && em.lon && (
                    <div className="text-xs text-gray-400">
                      GPS: {em.lat.toFixed(5)}, {em.lon.toFixed(5)}
                    </div>
                  )}
                </div>
                <button className="flex items-center gap-1.5 rounded-lg bg-verde px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-verde/90">
                  <CheckCircle className="h-4 w-4" />
                  Controlada
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incidencias */}
      {incidencias.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-bold text-amber-600">
            <AlertTriangle className="h-4 w-4" /> Incidencias Ferroviarias Activas
          </h3>
          {incidencias.map((inc, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
              <div className="h-1 w-full bg-amber-400" />
              <div className="flex items-start justify-between p-4">
                <div className="space-y-1">
                  <div className="font-bold text-amber-700">
                    {inc.evento} — Tren {inc.tren} ({inc.equipo})
                  </div>
                  <div className="text-sm text-gray-600">
                    <b>Hora:</b> {inc.fecha_hora} | <b>Ubicación:</b> {inc.ubicacion}
                  </div>
                  <div className="text-sm text-gray-600">
                    <b>Tripulación:</b> Maq. {inc.maquinista} | Ayu. {inc.ayudante}
                  </div>
                  <div className="text-sm text-gray-600">
                    <b>Detalle:</b> {inc.detalle}
                  </div>
                </div>
                <button className="flex items-center gap-1.5 rounded-lg bg-verde px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-verde/90">
                  <CheckCircle className="h-4 w-4" />
                  Controlada
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tráfico en vivo */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Train className="h-5 w-5 text-azul" />
            <h3 className="font-bold text-azul">Tráfico en Vivo — Servicios Activos</h3>
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            {ultimaActualizacion && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" /> Actualizado: {ultimaActualizacion}
              </span>
            )}
            <button
              onClick={cargarServicios}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
            >
              <RefreshCw className="h-3 w-3" /> Actualizar
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {servicios.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No hay servicios activos registrados para hoy.
            </div>
          ) : servicios.map(srv => {
            const pasadas: Pasada[] = pasadasMap[srv.id] || [];
            const abierto = expandido === srv.id;
            // Última estación marcada
            const marcadas = pasadas.filter(p => p.estado !== 'SIN MARCAR');
            const ultima = marcadas[marcadas.length - 1];
            // Color global del servicio según último atraso
            const colorEstado = srv.estado === 'EMERGENCIA' ? 'border-red-400 bg-red-50' :
              ultima?.estado === 'ATRASO' && ultima.minutos_atraso > 5 ? 'border-red-300 bg-red-50/30' :
              ultima?.estado === 'ATRASO' ? 'border-amber-300 bg-amber-50/30' :
              marcadas.length > 0 ? 'border-green-300 bg-green-50/20' :
              'border-gray-200 bg-white';

            return (
              <div key={srv.id} className={`border-l-4 ${colorEstado} transition-colors`}>
                {/* Cabecera del servicio */}
                <button
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 text-left"
                  onClick={() => setExpandido(abierto ? null : srv.id)}
                >
                  <div className="flex items-center gap-4">
                    <Train className="h-4 w-4 text-azul flex-shrink-0" />
                    <div>
                      <span className="font-bold text-azul text-sm">Servicio {srv.tren_num}</span>
                      <span className="mx-2 text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{srv.equipo_id}</span>
                    </div>
                    <div className="hidden sm:flex flex-col text-xs text-gray-600">
                      <span>Maq: <b>{srv.maquinista}</b></span>
                      <span>Ayu: <b>{srv.ayudante}</b></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {ultima && (
                      <span className="hidden md:flex items-center gap-1 text-xs text-gray-500">
                        Última pasada: <b className="ml-1">{ultima.estacion}</b>
                        {ultima.estado === 'ATRASO' && (
                          <span className={`ml-1 font-bold ${ultima.minutos_atraso > 5 ? 'text-rojo' : 'text-amber-600'}`}>
                            +{ultima.minutos_atraso}min
                          </span>
                        )}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      srv.estado === 'ACTIVO'     ? 'bg-green-100 text-green-700' :
                      srv.estado === 'EMERGENCIA' ? 'bg-red-100 text-rojo' :
                                                    'bg-gray-100 text-gray-600'
                    }`}>{srv.estado}</span>
                    <span className="text-gray-400 text-xs">{abierto ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Progreso de estaciones expandido */}
                {abierto && (
                  <div className="px-5 pb-4 pt-2">
                    {pasadas.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Sin pasadas registradas aún.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {pasadas.map((p, i) => {
                          const esPendiente = p.estado === 'SIN MARCAR';
                          const esAtraso    = p.estado === 'ATRASO';
                          const minutos     = p.minutos_atraso;
                          const color =
                            esPendiente ? 'bg-gray-100 text-gray-400 border-gray-200' :
                            esAtraso && minutos > 10 ? 'bg-red-100 text-red-700 border-red-300' :
                            esAtraso && minutos > 5  ? 'bg-orange-100 text-orange-700 border-orange-300' :
                            esAtraso                 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                                       'bg-green-100 text-green-700 border-green-300';
                          return (
                            <div key={i} className={`flex flex-col items-center rounded-lg border px-3 py-1.5 text-center ${color}`} style={{ minWidth: '90px' }}>
                              <span className="text-[11px] font-semibold leading-tight">{p.estacion}</span>
                              {esPendiente ? (
                                <span className="text-[10px] mt-0.5 opacity-60">Pendiente</span>
                              ) : esAtraso ? (
                                <span className="text-[10px] font-bold mt-0.5">+{minutos}min</span>
                              ) : (
                                <span className="text-[10px] mt-0.5">✓ A la Hora</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => cargarPasadas(srv)}
                      className="mt-3 flex items-center gap-1 text-[11px] font-medium text-azul hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" /> Actualizar pasadas
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mapa de eventos */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
          <MapPin className="h-5 w-5 text-azul" />
          <h3 className="font-bold text-azul">Mapa de Eventos Operacionales (Últimas 24h)</h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="py-8 text-center text-gray-400">Cargando eventos...</div>
          ) : eventos.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No se registran incidencias ni emergencias en las últimas 24 horas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-bold uppercase tracking-wide text-azul">
                    <th className="px-3 py-2.5 text-left">Fecha/Hora</th>
                    <th className="px-3 py-2.5 text-left">Tipo</th>
                    <th className="px-3 py-2.5 text-left">Tren</th>
                    <th className="px-3 py-2.5 text-left">Equipo</th>
                    <th className="px-3 py-2.5 text-left">Evento</th>
                    <th className="px-3 py-2.5 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {eventos.map((ev, i) => (
                    <tr key={i} className="hover:bg-gray-50/70">
                      <td className="px-3 py-2 text-xs">{ev.fecha_hora}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            ev.tipo === 'Emergencia' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {ev.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2">{ev.tren}</td>
                      <td className="px-3 py-2">{ev.equipo}</td>
                      <td className="px-3 py-2 text-xs">{ev.evento}</td>
                      <td className="px-3 py-2 text-xs">{ev.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
