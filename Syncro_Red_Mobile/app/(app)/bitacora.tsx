import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient, { STORAGE_KEYS } from '@/services/apiClient';

export default function BitacoraScreen() {
  const [reporte, setReporte] = useState('');
  const [incidencia, setIncidencia] = useState('');
  const [token, setToken] = useState<string | null>(null);

  React.useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEYS.ACCESS).then(setToken);
  }, []);

  const handleEnviar = async () => {
    if (!reporte.trim() && !incidencia.trim()) {
      Alert.alert('Error', 'Debes escribir un reporte o incidencia');
      return;
    }

    try {
      await apiClient.post(
        '/api/bitacora/reporte/',
        {
          reporte_final: reporte.trim(),
          novedad_operativa: incidencia.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Éxito', 'Reporte enviado correctamente');
      setReporte('');
      setIncidencia('');
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar el reporte');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bitácora del día</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Reporte Final</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe el reporte final del turno..."
          value={reporte}
          onChangeText={setReporte}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Novedad Operativa</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe cualquier novedad ocurrida..."
          value={incidencia}
          onChangeText={setIncidencia}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleEnviar}>
        <Text style={styles.buttonText}>Enviar Reporte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#C0392B', marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#C0392B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
