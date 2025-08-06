import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Device {
  _id: string;
  nombre: string;
  modelo: string;
  ubicacion: {
    ciudad: string;
    pais: string;
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

export default function HomeScreen() {
  const { userId } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<LastReading[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

 const fetchDevices = async () => {
  try {
    const res = await axios.get(`http://192.168.0.119:3000/devices/usuario/${userId}`);
    setDevices(res.data);
  } catch (error) {
    console.error('Error al obtener dispositivos:', error);
  }
};


  const fetchLastReadings = async () => {
    try {
      const res = await axios.get(`http://192.168.0.119:3000/readings/${userId}`);
      const lastReadings = res.data.reduce((acc: Record<string, LastReading>, reading: LastReading) => {
        const existing = acc[reading.dispositivo_id];
        if (!existing || new Date(reading.timestamp) > new Date(existing.timestamp)) {
          acc[reading.dispositivo_id] = reading;
        }
        return acc;
      }, {});
      setReadings(Object.values(lastReadings));
    } catch (error) {
      console.error('Error al obtener lecturas:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([fetchDevices(), fetchLastReadings()]).finally(() => setLoading(false));
  }, [userId]);

  const getReadingForDevice = (deviceId: string) => {
    return readings.find(r => r.dispositivo_id === deviceId);
  };

  const renderItem = ({ item }: { item: Device }) => {
    const reading = getReadingForDevice(item._id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/device/${item._id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.nombre}</Text>
          <View style={[styles.statusIndicator, { 
            backgroundColor: item.estado === 'activo' ? '#4CAF50' : '#F44336'
          }]} />
        </View>
        <Text style={styles.model}>{item.modelo}</Text>
        <Text style={styles.location}>
          {item.ubicacion?.ciudad}, {item.ubicacion?.pais}
        </Text>
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
          </View>
        ) : (
          <Text style={styles.noDataText}>Sin datos recientes</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Dispositivos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/scan-setup')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

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
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// Paleta de colores azules profesionales
const colors = {
  primary: '#1E88E5',
  primaryDark: '#1565C0',
  primaryLight: '#42A5F5',
  accent: '#2979FF',
  background: '#E3F2FD',
  text: '#212121',
  textSecondary: '#757575',
  white: '#FFFFFF',
  divider: '#BDBDBD',
  success: '#4CAF50',
  error: '#F44336',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  model: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  readingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  readingItem: {
    alignItems: 'center',
  },
  readingLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  readingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryDark,
  },
  noDataText: {
    color: colors.divider,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  addDeviceButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 4,
  },
  addDeviceButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});