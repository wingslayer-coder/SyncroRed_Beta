import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { useAlertas } from '../context/AlertasContext';
import type { EventoMapa } from '../types';
import { Map, Layers, MapPin } from 'lucide-react';

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

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Componente para la capa de calor
function HeatmapLayer({ data }: { data: EventoMapa[] }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    const points = data
      .filter(ev => ev.lat !== null && ev.lon !== null)
      .map(ev => [
        ev.lat!,
        ev.lon!,
        ev.tipo === 'Emergencia' ? 1.0 : ev.tipo === 'Falla de Equipo' ? 0.7 : 0.5 // Intensidad
      ] as L.HeatLatLngTuple);

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    heatLayerRef.current = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 13,
      gradient: { 0.4: 'yellow', 0.65: 'orange', 1: 'red' }
    }).addTo(map);

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, data]);

  return null;
}

export default function MapaFerroviario() {
  const { eventos } = useAlertas();
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');

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
        
        {/* Toggle View Mode */}
        <div className="flex p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode('markers')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-colors ${
              viewMode === 'markers' ? 'bg-white text-azul shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="h-4 w-4" /> Puntos
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-colors ${
              viewMode === 'heatmap' ? 'bg-white text-rojo shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="h-4 w-4" /> Mapa de Calor
          </button>
        </div>
      </div>

      <div className="relative z-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <MapContainer center={[-36.827, -73.05]} zoom={11} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {viewMode === 'heatmap' && <HeatmapLayer data={eventos} />}
          
          {viewMode === 'markers' && eventos.map((ev, idx) => {
            if (ev.lat !== null && ev.lon !== null) {
              return (
                <Marker
                  key={ev.id || idx}
                  position={[ev.lat, ev.lon]}
                  icon={ev.tipo === 'Emergencia' ? redIcon : ev.tipo === 'Falla de Equipo' ? orangeIcon : yellowIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[210px]">
                      <div className="mb-2 border-b pb-1 font-bold text-azul">{ev.tipo}</div>
                      <div className="text-sm mb-1"><b>Evento:</b> {ev.evento}</div>
                      {ev.notificado_por && <div className="text-sm mb-1"><b>Notificado por:</b> {ev.notificado_por}</div>}
                      {ev.equipo && <div className="text-sm mb-1"><b>Equipo:</b> {ev.equipo}</div>}
                      <div className="text-sm mb-1"><b>Servicio:</b> {ev.tren || '—'}</div>
                      {ev.ubicacion && <div className="text-sm mb-1"><b>Ubicación:</b> {ev.ubicacion}</div>}
                      <div className="text-sm mb-1"><b>Estado:</b> <span className="font-semibold">{ev.estado}</span></div>
                      <div className="mt-2 text-xs text-gray-500 text-right">{ev.fecha_hora ? new Date(ev.fecha_hora).toLocaleString() : ''}</div>
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
              <span className="h-3 w-3 rounded-full bg-orange-500 ring-2 ring-orange-200" /> Falla de Equipo
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-400 ring-2 ring-yellow-200" /> Incidencia Ferroviaria
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
