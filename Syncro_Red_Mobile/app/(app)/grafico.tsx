import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient, { STORAGE_KEYS } from '@/services/apiClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Turno {
  fecha: string;
  num_turno: string;
  tipo_dia: string;
  servicios: string;
  presentacion_hora: string;
  presentacion_lugar: string;
  cierre_hora: string;
  cierre_lugar: string;
}

export default function GraficoScreen() {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  React.useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEYS.ACCESS).then(setToken);
  }, []);

  const cargarGrafico = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/operaciones/grafico-mensual/?mes=${mes}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTurnos(res.data.results || []);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el gráfico mensual');
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  const cambiarMes = (delta: number) => {
    const [year, m] = mes.split('-').map(Number);
    const nuevaFecha = new Date(year, m - 1 + delta, 1);
    setMes(nuevaFecha.toISOString().slice(0, 7));
  };

  React.useEffect(() => {
    cargarGrafico();
  }, [mes]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {format(new Date(mes + '-01'), 'MMMM yyyy', { locale: es })}
        </Text>
        <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.navBtn}>
          <Text style={styles.navBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loading}>Cargando...</Text>
      ) : turnos.length === 0 ? (
        <Text style={styles.empty}>No hay turnos asignados este mes</Text>
      ) : (
        turnos.map((t, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.fecha}>{format(new Date(t.fecha), 'EEE dd', { locale: es })}</Text>
              <Text style={styles.turno}>{t.num_turno}</Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.detail}>
                <Text style={styles.label}>Servicios:</Text> {t.servicios || '---'}
              </Text>
              <Text style={styles.detail}>
                <Text style={styles.label}>Presentación:</Text> {t.presentacion_hora} {t.presentacion_lugar}
              </Text>
              <Text style={styles.detail}>
                <Text style={styles.label}>Cierre:</Text> {t.cierre_hora} {t.cierre_lugar}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 18, color: '#C0392B', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#C0392B' },
  loading: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#888' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#888' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fecha: { fontSize: 16, fontWeight: '600', color: '#333' },
  turno: { fontSize: 16, fontWeight: '700', color: '#C0392B' },
  details: {},
  detail: { fontSize: 14, color: '#555', marginBottom: 4 },
  label: { fontWeight: '600' },
});
