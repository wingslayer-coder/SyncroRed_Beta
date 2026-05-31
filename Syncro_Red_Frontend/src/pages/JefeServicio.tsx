import { useEffect, useState } from 'react';
import client from '../api/client';
import type { EventoMapa } from '../types';
import { AlertTriangle, MapPin, CheckCircle, Train, Activity } from 'lucide-react';

export default function JefeServicio() {
  const [eventos, setEventos] = useState<EventoMapa[]>([]);
  const [loading, setLoading] = useState(true);
  const hoy = new Date().toISOString().split('T')[0];
  const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  useEffect(() => {
    client.get(`/operaciones/eventos-mapa/?fecha_desde=${ayer}&fecha_hasta=${hoy}`)
      .then((res) => setEventos(res.data.eventos))
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));
  }, []);

  const incidencias = eventos.filter((e) => e.tipo === 'Incidencia');
  const emergencias = eventos.filter((e) => e.tipo === 'Emergencia');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-azul flex items-center gap-2">
          <Activity className="w-6 h-6 text-rojo" />
          Consola de Control de Tráfico
        </h2>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-CL')} {new Date().toLocaleTimeString('es-CL')}
        </span>
      </div>

      {(emergencias.length > 0 || incidencias.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <AlertTriangle className="w-5 h-5" />
            {emergencias.length + incidencias.length} ALERTA(S) ACTIVA(S) EN LA RED
          </div>
        </div>
      )}

      {emergencias.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-red-600 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Emergencias Activas
          </h3>
          {emergencias.map((em, i) => (
            <div key={i} className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-red-600">
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
                <button className="bg-verde text-white text-xs font-bold px-3 py-2 rounded-md hover:bg-verde/90">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Controlada
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {incidencias.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-amber-600 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Incidencias Ferroviarias Activas
          </h3>
          {incidencias.map((inc, i) => (
            <div key={i} className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
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
                <button className="bg-verde text-white text-xs font-bold px-3 py-2 rounded-md hover:bg-verde/90">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Controlada
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-azul mb-3 flex items-center gap-2">
          <Train className="w-5 h-5" /> Tráfico en Vivo — Servicios Activos
        </h3>
        <div className="text-sm text-gray-500">
          Los servicios activos se mostrarán aquí cuando el endpoint de servicios en curso esté implementado.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-azul mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Mapa de Eventos Operacionales (Últimas 24h)
        </h3>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando eventos...</div>
        ) : eventos.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">
            No se registran incidencias ni emergencias en las últimas 24 horas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Fecha/Hora</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Tren</th>
                  <th className="px-3 py-2 text-left">Equipo</th>
                  <th className="px-3 py-2 text-left">Evento</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eventos.map((ev, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs">{ev.fecha_hora}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        ev.tipo === 'Emergencia' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
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
  );
}
