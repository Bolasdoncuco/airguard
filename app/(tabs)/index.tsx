// HomeScreen.tsx
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Device {
  _id: string;
  nombre: string;
  modelo: string;
  ubicacion?: {          // ahora opcional
    ciudad?: string;
    pais?: string;
  };
  estado: string;
}

interface LastReading {
  dispositivo_id: string;
  Temperatura: number;
  Humedad: number;
  IAQ: number;
  timestamp: string;
}

const API_BASE = 'http://192.168.0.119:3000';
const api = axios.create({ baseURL: API_BASE });

export default function HomeScreen() {
  const { userId } = useAuth();
  const router = useRouter();

  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<LastReading[]>([]);

  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [errorDevices, setErrorDevices] = useState<string | null>(null);
  const [errorReadings, setErrorReadings] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setErrorDevices(null);
      const res = await api.get<Device[]>(`/devices/usuario/${userId}`);
      setDevices(res.data);
    } catch (error) {
      console.error('Error al obtener dispositivos:', error);
      setErrorDevices('No se pudieron cargar los dispositivos.');
    } finally {
      setLoadingDevices(false);
    }
  }, [userId]);

  const fetchLastReadings = useCallback(async () => {
    try {
      setErrorReadings(null);
      const res = await api.get<LastReading[]>(`/readings/${userId}`);
      const latest: Record<string, LastReading> = {};
      res.data.forEach(r => {
        const prev = latest[r.dispositivo_id];
        if (!prev || new Date(r.timestamp) > new Date(prev.timestamp)) {
          latest[r.dispositivo_id] = r;
        }
      });
      setReadings(Object.values(latest));
    } catch (error) {
      console.error('Error al obtener lecturas:', error);
      setErrorReadings('No se pudieron cargar las lecturas.');
    } finally {
      setLoadingReadings(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      router.replace('/login');
      return;
    }
    setLoadingDevices(true);
    setLoadingReadings(true);
    fetchDevices();
    fetchLastReadings();
  }, [userId, fetchDevices, fetchLastReadings, router]);

  const onRefresh = () => {
    setLoadingDevices(true);
    setLoadingReadings(true);
    return Promise.all([fetchDevices(), fetchLastReadings()]);
  };

  const getReadingForDevice = (deviceId: string) =>
    readings.find(r => r.dispositivo_id === deviceId);

  const renderItem = useCallback(
    ({ item }: { item: Device }) => {
      const reading = getReadingForDevice(item._id);
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/device/${item._id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{item.nombre}</Text>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: item.estado === 'activo' ? '#4CAF50' : '#F44336' },
              ]}
            />
          </View>
          <Text style={styles.model}>{item.modelo}</Text>
          <Text style={styles.location}>
            {item.ubicacion?.ciudad ?? '—'}, {item.ubicacion?.pais ?? '—'}
          </Text>
          {errorReadings && (
            <Text style={styles.errorText}>{errorReadings}</Text>
          )}
          {reading ? (
            <View style={styles.readingsContainer}>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>Temp</Text>
                <Text style={styles.readingValue}>{reading.Temperatura}°C</Text>
              </View>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>Humedad</Text>
                <Text style={styles.readingValue}>{reading.Humedad}%</Text>
              </View>
              <View style={styles.readingItem}>
                <Text style={styles.readingLabel}>IAQ</Text>
                <Text style={styles.readingValue}>{reading.IAQ}</Text>
              </View>
              <Text style={styles.timestamp}>
                {new Date(reading.timestamp).toLocaleString()}
              </Text>
            </View>
          ) : (
            <Text style={styles.noDataText}>Sin datos recientes</Text>
          )}
        </TouchableOpacity>
      );
    },
    [readings, errorReadings, router]
  );

  if (loadingDevices && loadingReadings) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Dispositivos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/scan-setup')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {errorDevices && (
        <Text style={styles.errorTextCenter}>{errorDevices}</Text>
      )}

      {devices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No tienes dispositivos registrados</Text>
          <TouchableOpacity
            style={styles.addDeviceButton}
            onPress={() => router.push('/scan-setup')}
          >
            <Text style={styles.addDeviceButtonText}>Agregar dispositivo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loadingDevices || loadingReadings}
          onRefresh={onRefresh}
          initialNumToRender={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD', padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorTextCenter: { color: '#F44336', textAlign: 'center', marginVertical: 16 },
  header: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#1565C0' },
  addButton: {
    backgroundColor: '#1E88E5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', lineHeight: 28 },
  listContent: { paddingBottom: 16 },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '600', color: '#212121' },
  statusIndicator: { width: 12, height: 12, borderRadius: 6 },
  model: { fontSize: 14, color: '#757575', marginBottom: 4 },
  location: { fontSize: 14, color: '#757575', marginBottom: 12 },
  readingsContainer: { marginTop: 8 },
  readingItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  readingLabel: { fontSize: 12, color: '#757575', marginRight: 8 },
  readingValue: { fontSize: 16, fontWeight: '500', color: '#1565C0' },
  timestamp: { fontSize: 10, color: '#9E9E9E', marginTop: 4 },
  noDataText: { color: '#BDBDBD', fontStyle: 'italic', textAlign: 'center', marginVertical: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 18, color: '#757575', marginBottom: 24, textAlign: 'center' },
  addDeviceButton: { backgroundColor: '#1E88E5', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, elevation: 4 },
  addDeviceButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#F44336', fontSize: 16, marginVertical: 4 },
});
