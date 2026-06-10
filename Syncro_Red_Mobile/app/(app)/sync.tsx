import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { getPendingSyncOps } from '@/db/database';
import { syncPendingOps, isOnline, SyncResult } from '@/services/syncService';

export default function SyncScreen() {
  const [pending, setPending] = useState(0);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadPending = async () => {
    const ops = await getPendingSyncOps();
    setPending(ops.length);
    const net = await isOnline();
    setOnline(net);
  };

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, 10_000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await syncPendingOps();
      setResult(res);
      setLastSync(new Date().toLocaleTimeString('es-CL'));
      await loadPending();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.networkCard}>
        <Text style={[styles.networkDot, { color: online ? '#27AE60' : '#E74C3C' }]}>●</Text>
        <Text style={styles.networkLabel}>{online ? 'Conectado' : 'Sin conexión'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{pending}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        {result && (
          <>
            <View style={[styles.statCard, styles.statOk]}>
              <Text style={styles.statNum}>{result.enviados}</Text>
              <Text style={styles.statLabel}>Enviados</Text>
            </View>
            <View style={[styles.statCard, result.errores > 0 ? styles.statErr : {}]}>
              <Text style={styles.statNum}>{result.errores}</Text>
              <Text style={styles.statLabel}>Errores</Text>
            </View>
          </>
        )}
      </View>

      {lastSync && (
        <Text style={styles.lastSync}>Última sincronización: {lastSync}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, !online && styles.buttonDisabled, loading && styles.buttonDisabled]}
        onPress={handleSync}
        disabled={loading || !online}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>🔄 Sincronizar ahora</Text>
        }
      </TouchableOpacity>

      {!online && (
        <View style={styles.offlineInfo}>
          <Text style={styles.offlineInfoText}>
            Las operaciones registradas sin conexión se guardan localmente y se enviarán automáticamente cuando recuperes señal.
          </Text>
        </View>
      )}

      {result && result.errores === 0 && result.enviados > 0 && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✅ Sincronización completada — {result.enviados} operación(es) enviada(s)</Text>
        </View>
      )}

      {result && result.errores > 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {result.errores} operación(es) con error. Se reintentarán automáticamente.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  networkCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  networkDot: { fontSize: 18, marginRight: 8 },
  networkLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statOk: { borderTopWidth: 3, borderTopColor: '#27AE60' },
  statErr: { borderTopWidth: 3, borderTopColor: '#E74C3C' },
  statNum: { fontSize: 32, fontWeight: '900', color: '#222' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2, textTransform: 'uppercase', fontWeight: '600' },
  lastSync: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 16 },
  button: {
    backgroundColor: '#C0392B', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  offlineInfo: { backgroundColor: '#FEF9E7', borderRadius: 10, padding: 14, marginTop: 16 },
  offlineInfoText: { fontSize: 13, color: '#7D6608', lineHeight: 20 },
  successBanner: { backgroundColor: '#D5F5E3', borderRadius: 10, padding: 14, marginTop: 16 },
  successText: { fontSize: 14, color: '#1D8348', fontWeight: '600' },
  errorBanner: { backgroundColor: '#FADBD8', borderRadius: 10, padding: 14, marginTop: 16 },
  errorText: { fontSize: 14, color: '#922B21', fontWeight: '600' },
});
