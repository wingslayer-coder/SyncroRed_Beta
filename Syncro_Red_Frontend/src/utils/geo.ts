/* ======================================================================
   UTILIDAD — Geolocalización (GPS del navegador)
   ====================================================================== */

import { useEffect, useState } from 'react';

export interface Coords {
  lat: number;
  lon: number;
}

/** Distancia en metros entre dos coordenadas (Haversine). */
export function distanciaMetros(a: Coords, b: Coords): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Hook que sigue la ubicación GPS del dispositivo de forma continua.
 * Devuelve { coords, error }. Mantiene el GPS activo mientras el componente está montado.
 */
export function useUbicacionContinua(): { coords: Coords | null; error: string | null } {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('El dispositivo no soporta geolocalización');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setError(null); },
      (err) => setError(err.message || 'No se pudo obtener la ubicación'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { coords, error };
}

/**
 * Obtiene una sola lectura de GPS. Resuelve con las coordenadas o `null`
 * si el permiso fue denegado, no hay señal o el navegador no lo soporta.
 * Nunca rechaza, para no romper el flujo de envío de una incidencia.
 */
export function obtenerUbicacionGPS(timeoutMs = 8000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
    );
  });
}

/**
 * Espera (vía watchPosition) hasta obtener la primera lectura válida de GPS
 * y entonces llama a `cb` una sola vez. Útil cuando el permiso/señal llega
 * tarde y hay que actualizar (PATCH) un reporte ya creado sin coordenadas.
 * Devuelve una función para cancelar la espera.
 */
export function vigilarUbicacion(
  cb: (coords: Coords) => void,
  maxEsperaMs = 120000
): () => void {
  if (!('geolocation' in navigator)) return () => {};

  let cancelado = false;
  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (cancelado) return;
      cancelado = true;
      navigator.geolocation.clearWatch(watchId);
      cb({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    },
    () => { /* seguir intentando hasta el timeout */ },
    { enableHighAccuracy: true, maximumAge: 0 }
  );

  const timer = setTimeout(() => {
    cancelado = true;
    navigator.geolocation.clearWatch(watchId);
  }, maxEsperaMs);

  return () => {
    cancelado = true;
    clearTimeout(timer);
    navigator.geolocation.clearWatch(watchId);
  };
}
