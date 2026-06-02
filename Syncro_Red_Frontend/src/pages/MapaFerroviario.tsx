import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import client from '../api/client';
import type { EventoMapa } from '../types';
import { Map, RefreshCw } from 'lucide-react';

// Arreglo para los iconos de leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapaFerroviario() {
  const [eventos, setEventos] = useState<EventoMapa[]>([]);
  const [loading, setLoading] = useState(true);

  const hoy = new Date().toISOString().split('T')[0];
  const ayer = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];

  const cargarEventos = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/operaciones/eventos-mapa/?fecha_desde=${ayer}&fecha_hasta=${hoy}`);
      setEventos(res.data.eventos || []);
    } catch (err) {
      console.error('Error fetching map events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azul/10">
            <Map className="h-6 w-6 text-rojo" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-azul leading-tight">Mapa Ferroviario en Vivo</h2>
            <p className="text-sm text-gray-400">Eventos georreferenciados de la red</p>
          </div>
        </div>
        <button
          onClick={cargarEventos}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      <div className="relative z-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <MapContainer center={[-36.827, -73.05]} zoom={11} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {eventos.map((ev, idx) => {
            if (ev.lat && ev.lon) {
              return (
                <Marker
                  key={idx}
                  position={[ev.lat, ev.lon]}
                  icon={ev.tipo === 'Emergencia' ? redIcon : orangeIcon}
                >
                  <Popup>
                    <div className="p-1">
                      <div className="mb-1 border-b pb-1 font-bold">{ev.tipo} - Tren {ev.tren}</div>
                      <div className="text-sm"><b>Evento:</b> {ev.evento}</div>
                      <div className="text-sm"><b>Estado:</b> {ev.estado}</div>
                      <div className="mt-2 text-xs text-gray-500">{ev.fecha_hora}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
        </MapContainer>

        {/* Leyenda flotante */}
        <div className="absolute bottom-6 left-6 z-[1000] rounded-xl border border-gray-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
          <h4 className="mb-2.5 border-b border-gray-100 pb-1.5 text-xs font-bold uppercase tracking-wide text-azul">
            Leyenda
          </h4>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-600 ring-2 ring-red-200" /> Emergencia Activa
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-500 ring-2 ring-orange-200" /> Incidencia Ferroviaria
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
