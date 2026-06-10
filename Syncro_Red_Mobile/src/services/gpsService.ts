import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { GPS_BACKGROUND_TASK, GPS_UPDATE_INTERVAL_MS } from '@/config/api';
import api from '@/services/apiClient';
import { enqueueSyncOp } from '@/db/database';

export interface GpsPayload {
  servicioId: number;
  latitud: number;
  longitud: number;
}

TaskManager.defineTask(GPS_BACKGROUND_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
  if (error) return;
  const locations = (data as { locations: Location.LocationObject[] }).locations;
  if (!locations?.length) return;

  const { latitude, longitude } = locations[0].coords;
  const servicioId: number | null = (global as Record<string, unknown>).__syncro_servicio_id as number ?? null;
  if (!servicioId) return;

  const ts = new Date().toISOString();
  try {
    await api.patch(`/api/operaciones/servicios-activos/${servicioId}/gps/`, {
      latitud: latitude,
      longitud: longitude,
    });
  } catch {
    await enqueueSyncOp('gps', { servicio_id: servicioId, latitud: latitude, longitud: longitude }, ts);
  }
});

export async function startGpsTracking(servicioId: number): Promise<void> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') throw new Error('Permiso de ubicación en primer plano denegado');

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') throw new Error('Permiso de ubicación en segundo plano denegado');

  (global as Record<string, unknown>).__syncro_servicio_id = servicioId;

  const isRunning = await Location.hasStartedLocationUpdatesAsync(GPS_BACKGROUND_TASK).catch(() => false);
  if (!isRunning) {
    await Location.startLocationUpdatesAsync(GPS_BACKGROUND_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: GPS_UPDATE_INTERVAL_MS,
      distanceInterval: 50,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Syncro Red — Servicio activo',
        notificationBody: 'Registrando posición del tren en servicio.',
        notificationColor: '#C0392B',
      },
    });
  }
}

export async function stopGpsTracking(): Promise<void> {
  (global as Record<string, unknown>).__syncro_servicio_id = null;
  const isRunning = await Location.hasStartedLocationUpdatesAsync(GPS_BACKGROUND_TASK).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(GPS_BACKGROUND_TASK);
  }
}

export async function getCurrentLocation(): Promise<{ latitud: number; longitud: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permiso de ubicación denegado');
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitud: loc.coords.latitude, longitud: loc.coords.longitude };
}
