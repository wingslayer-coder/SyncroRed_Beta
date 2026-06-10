import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/services/apiClient';
import { cacheTurno, getCachedTurno } from '@/db/database';
import { useAuthStore } from '@/stores/authStore';

interface TurnoData {
  turno: string | null;
  tipo_dia: string;
  servicios: string;
  presentacion_hora: string;
  presentacion_lugar: string;
  cierre_hora: string;
  cierre_lugar: string;
  fecha: string;
  servicio_activo: {
    id: number;
    tren_num: string;
    equipo_id: string;
    estado: string;
    latitud: number | null;
    longitud: number | null;
  } | null;
  itinerario: { estacion_nombre: string; hora_programada: string; orden_estacion: number }[];
}

export default function TurnoScreen() {
  const usuario = useAuthStore((s) => s.usuario);
  const [turno, setTurno] = useState<TurnoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const hoy = format(new Date(), 'yyyy-MM-dd');

  const loadTurno = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get<TurnoData>(`/api/operaciones/mi-turno/?fecha=${hoy}`);
      setTurno(data);
      setOffline(false);
      await cacheTurno(hoy, data);
    } catch {
      const cached = await getCachedTurno(hoy);
      if (cached) {
        setTurno(cached as TurnoData);
        setOffline(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadTurno(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  if (!turno?.turno) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>😴</Text>
        <Text style={styles.emptyText}>Sin turno asignado para hoy</Text>
        <Text style={styles.emptyDate}>{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => loadTurno()}>
          <Text style={styles.refreshBtnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTurno(true); }} tintColor="#C0392B" />}
    >
      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📡 Sin conexión — datos del caché local</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {usuario?.nombre} 👋</Text>
        <Text style={styles.dateText}>{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Turno</Text>
        <Text style={styles.turnoNum}>{turno.turno}</Text>
        <Text style={styles.tipoDia}>{turno.tipo_dia}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Presentación</Text>
        <Row label="Hora" value={turno.presentacion_hora} />
        <Row label="Lugar" value={turno.presentacion_lugar} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Cierre</Text>
        <Row label="Hora" value={turno.cierre_hora} />
        <Row label="Lugar" value={turno.cierre_lugar} />
      </View>

      {turno.servicio_activo && (
        <View style={[styles.card, styles.cardActive]}>
          <Text style={styles.cardLabel}>🚂 Servicio en curso</Text>
          <Row label="Tren" value={turno.servicio_activo.tren_num} />
          <Row label="Equipo" value={turno.servicio_activo.equipo_id} />
          <Row label="Estado" value={turno.servicio_activo.estado} />
        </View>
      )}

      {turno.itinerario.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Itinerario</Text>
          {turno.itinerario.map((est) => (
            <View key={est.orden_estacion} style={styles.estRow}>
              <Text style={styles.estHora}>{est.hora_programada}</Text>
              <Text style={styles.estNombre}>{est.estacion_nombre}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  offlineBanner: { backgroundColor: '#F39C12', padding: 10, alignItems: 'center' },
  offlineText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  header: { padding: 20, backgroundColor: '#C0392B' },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '700' },
  dateText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardActive: { borderLeftWidth: 4, borderLeftColor: '#27AE60' },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#C0392B', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  turnoNum: { fontSize: 48, fontWeight: '900', color: '#222', textAlign: 'center' },
  tipoDia: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { color: '#888', fontSize: 14 },
  rowValue: { color: '#222', fontSize: 14, fontWeight: '600' },
  estRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  estHora: { color: '#C0392B', fontWeight: '700', fontSize: 13, width: 52 },
  estNombre: { color: '#333', fontSize: 14, flex: 1 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#444', textAlign: 'center' },
  emptyDate: { fontSize: 14, color: '#888', marginTop: 4, textTransform: 'capitalize' },
  refreshBtn: { marginTop: 20, backgroundColor: '#C0392B', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  refreshBtnText: { color: '#fff', fontWeight: '700' },
});
