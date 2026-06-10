import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Switch,
} from 'react-native';
import { startGpsTracking, stopGpsTracking, getCurrentLocation } from '@/services/gpsService';
import { enqueueSyncOp } from '@/db/database';
import api from '@/services/apiClient';
import { isOnline } from '@/services/syncService';

export default function GpsScreen() {
  const [tracking, setTracking] = useState(false);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [inputServicioId, setInputServicioId] = useState('');
  const [position, setPosition] = useState<{ lat: number; lon: number; ts: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isOnline().then(setOnline);
  }, []);

  const sendGps = async (id: number) => {
    try {
      const { latitud, longitud } = await getCurrentLocation();
      const ts = new Date().toISOString();
      setPosition({ lat: latitud, lon: longitud, ts });
      const netOk = await isOnline();
      setOnline(netOk);
      if (netOk) {
        await api.patch(`/api/operaciones/servicios-activos/${id}/gps/`, { latitud, longitud });
      } else {
        await enqueueSyncOp('gps', { servicio_id: id, latitud, longitud }, ts);
      }
    } catch (e) {
      console.warn('GPS send error:', e);
    }
  };

  const toggleTracking = async () => {
    if (tracking) {
      await stopGpsTracking();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setTracking(false);
      setServicioId(null);
    } else {
      const id = parseInt(inputServicioId, 10);
      if (isNaN(id) || id <= 0) {
        Alert.alert('Error', 'Ingresa un ID de servicio válido');
        return;
      }
      setLoading(true);
      try {
        await startGpsTracking(id);
        setServicioId(id);
        setTracking(true);
        await sendGps(id);
        intervalRef.current = setInterval(() => sendGps(id), 15_000);
      } catch (err: unknown) {
        Alert.alert('Error GPS', (err as Error).message ?? 'No se pudo iniciar el GPS');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Estado</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, tracking ? styles.dotActive : styles.dotInactive]} />
          <Text style={styles.statusText}>{tracking ? 'Tracking activo' : 'Inactivo'}</Text>
        </View>
        <Text style={styles.networkText}>{online ? '🌐 En línea' : '📵 Sin conexión (modo offline)'}</Text>
      </View>

      {!tracking && (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>ID del Servicio Activo</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputPrefix}>#</Text>
            <Text
              style={styles.inputSimple}
              onPress={() => Alert.prompt?.('ID Servicio', 'Ingresa el ID del servicio activo', (val) => setInputServicioId(val))}
            >
              {inputServicioId || 'Toca para ingresar...'}
            </Text>
          </View>
        </View>
      )}

      {tracking && servicioId && (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Servicio #{servicioId}</Text>
          {position && (
            <>
              <Text style={styles.coord}>Lat: {position.lat.toFixed(6)}</Text>
              <Text style={styles.coord}>Lon: {position.lon.toFixed(6)}</Text>
              <Text style={styles.tsText}>Última actualización: {new Date(position.ts).toLocaleTimeString('es-CL')}</Text>
            </>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, tracking ? styles.buttonStop : styles.buttonStart, loading && styles.buttonDisabled]}
        onPress={toggleTracking}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{tracking ? '⏹ Detener GPS' : '▶ Iniciar GPS'}</Text>
        }
      </TouchableOpacity>

      <Text style={styles.hint}>
        {tracking
          ? 'La posición se envía cada 15 segundos. Si hay corte de red, se encola para sincronizar después.'
          : 'Al iniciar, el GPS se activa en segundo plano y continúa aunque cierres la app.'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  statusCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statusLabel: { fontSize: 11, fontWeight: '700', color: '#C0392B', textTransform: 'uppercase', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  dotActive: { backgroundColor: '#27AE60' },
  dotInactive: { backgroundColor: '#BDC3C7' },
  statusText: { fontSize: 16, fontWeight: '600', color: '#222' },
  networkText: { fontSize: 13, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  inputPrefix: { fontSize: 18, color: '#C0392B', fontWeight: '700', marginRight: 6 },
  inputSimple: { fontSize: 16, color: '#333', flex: 1 },
  coord: { fontSize: 15, color: '#333', fontFamily: 'monospace', paddingVertical: 2 },
  tsText: { fontSize: 12, color: '#888', marginTop: 6 },
  button: {
    borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  buttonStart: { backgroundColor: '#27AE60' },
  buttonStop: { backgroundColor: '#C0392B' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
