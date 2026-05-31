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
  shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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
      console.error("Error fetching map events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-azul flex items-center gap-2">
          <Map className="w-6 h-6 text-rojo" />
          Mapa Ferroviario en Vivo
        </h2>
        <button 
          onClick={cargarEventos}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm font-bold shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative z-0">
        <MapContainer center={[-36.827, -73.050]} zoom={11} className="w-full h-full">
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
                      <div className="font-bold border-b pb-1 mb-1">{ev.tipo} - Tren {ev.tren}</div>
                      <div className="text-sm"><b>Evento:</b> {ev.evento}</div>
                      <div className="text-sm"><b>Estado:</b> {ev.estado}</div>
                      <div className="text-xs text-gray-500 mt-2">{ev.fecha_hora}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
        </MapContainer>
        
        {/* Leyenda flotante */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <h4 className="font-bold text-xs mb-2 text-gray-700 uppercase tracking-wide">Leyenda</h4>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div> Emergencia Activa
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div> Incidencia Ferroviaria
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
