// app/device/[id].tsx  — DetalleDispositivo
import { useEnvioLecturas } from '@/hooks/useEnvioLecturas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import io, { Socket } from 'socket.io-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Dispositivo = {
  _id: string;
  nombre: string;
  modelo: string;
  ubicacion?: { ciudad?: string; estado?: string; pais?: string };
  estado?: string;
};

type Lecturas = {
  Temperatura?: number;
  Humedad?: number;
  IAQ?: number;
  Ventilador?: number;
  CO?: number;
  PM1_0?: number;
  PM2_5?: number;
  PM10?: number;
  VOCs?: number;
  H2?: number;
  CH4?: number;
  timestamp?: string;
  dispositivo_id?: string;
  usuario_id?: string;
};

const SOCKET_URL = 'http://192.168.0.119:3000';
const API_BASE = 'http://192.168.0.119:3000';
const api = axios.create({ baseURL: API_BASE });

export default function DetalleDispositivo() {
  const { id } = useLocalSearchParams();
  const deviceId = Array.isArray(id) ? id[0] : id;

  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [device, setDevice] = useState<Dispositivo | null>(null);
  const [lecturas, setLecturas] = useState<Lecturas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [powerOn, setPowerOn] = useState(true);

  // Enviar lecturas desde la app (si tienes ese flujo activo)
  useEnvioLecturas(deviceId, lecturas || undefined);

  // Suscripción WS (lecturas en vivo)
  useEffect(() => {
    if (!deviceId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinDevice', deviceId);
    });

    socket.on('nuevaLectura', (l: Lecturas) => {
      if (l?.dispositivo_id === deviceId) {
        setLecturas(l);
        if (typeof l.IAQ === 'number') verificarCalidadAire(l.IAQ);
      }
    });

    socket.on('connect_error', (e) => {
      console.log('WS error:', e?.message || e);
    });

    return () => {
      try {
        socket.emit('leaveDevice', deviceId);
        socket.removeAllListeners();
        socket.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [deviceId]);

  // Permisos de notificación (una vez)
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No podrás recibir alertas de calidad del aire.');
      }
    })();
  }, []);

  // Fetch inicial
  const obtenerDatos = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        router.replace('/login');
        return;
      }

      const [devRes, readsRes] = await Promise.all([
        api.get<Dispositivo>(`/devices/${deviceId}?usuario_id=${userId}`),
        api.get<Lecturas[]>(`/readings/${userId}?dispositivo_id=${deviceId}`),
      ]);

      setDevice(devRes.data);

      if (Array.isArray(readsRes.data) && readsRes.data.length > 0) {
        const last = readsRes.data[0];
        setLecturas(last);
        if (typeof last.IAQ === 'number') verificarCalidadAire(last.IAQ);
      } else {
        setLecturas(null);
      }

      setPowerOn(true);
    } catch (err) {
      console.error('Error obtenerDatos', err);
      Alert.alert('Error', 'No se pudieron obtener datos del dispositivo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, [deviceId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await obtenerDatos();
  };

  const verificarCalidadAire = async (iaq: number) => {
    const UMBRAL = 150;
    if (iaq > UMBRAL) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Calidad del aire pobre',
          body: `IAQ: ${iaq}. Se recomienda ventilar.`,
        },
        trigger: null,
      });
    }
  };

  const togglePower = async () => {
    try {
      const nuevo = !powerOn;
      setPowerOn(nuevo);
      await api.post(`/devices/${deviceId}/power`, { estado: nuevo ? 'on' : 'off' });
    } catch (e) {
      console.error('togglePower', e);
      Alert.alert('Error', 'No se pudo cambiar el estado del dispositivo.');
    }
  };

  const updateFanSpeed = async (value: number) => {
    try {
      setLecturas((prev) => (prev ? { ...prev, Ventilador: value } : prev));
      await api.post(`/devices/${deviceId}/fan`, { velocidad: value });
    } catch (e) {
      console.error('updateFanSpeed', e);
    }
  };

  const handleEliminar = () => {
    Alert.alert('Eliminar', '¿Eliminar este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/devices/${deviceId}`);
            router.back();
          } catch (e) {
            console.error('Eliminar dispositivo', e);
            Alert.alert('Error', 'No se pudo eliminar el dispositivo.');
          }
        },
      },
    ]);
  };

  // Helpers UI
  const fmt = (n?: number, suf = '') =>
    typeof n === 'number' ? `${n}${suf}` : '—';

  const ubicacionTexto = () => {
    const u = device?.ubicacion || {};
    const parts = [u.ciudad, u.estado, u.pais].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#F44336' }}>No se encontró el dispositivo</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>{device.nombre}</Text>
        <Text style={styles.subtitle}>{device.modelo}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Ubicación:</Text>
          <Text style={styles.value}>{ubicacionTexto()}</Text>

          <Text style={styles.label}>Estado:</Text>
          <Text style={styles.value}>{powerOn ? '🟢 Encendido' : '🔴 Apagado'}</Text>

          {lecturas?.timestamp && (
            <>
              <Text style={styles.label}>Última actualización:</Text>
              <Text style={styles.value}>
                {new Date(lecturas.timestamp).toLocaleString()}
              </Text>
            </>
          )}
        </View>

        {lecturas ? (
          <>
            <Text style={styles.sectionTitle}>Lecturas recientes</Text>
            <View style={styles.infoBox}>
              <Row label="Temperatura" value={fmt(lecturas.Temperatura, ' °C')} />
              <Row label="Humedad" value={fmt(lecturas.Humedad, ' %')} />
              <Row label="IAQ" value={fmt(lecturas.IAQ)} />
              <Row label="CO" value={fmt(lecturas.CO, ' ppm')} />
              <Row label="PM1.0" value={fmt(lecturas.PM1_0, ' µg/m³')} />
              <Row label="PM2.5" value={fmt(lecturas.PM2_5, ' µg/m³')} />
              <Row label="PM10" value={fmt(lecturas.PM10, ' µg/m³')} />
              <Row label="VOCs" value={fmt(lecturas.VOCs, ' ppm')} />
              <Row label="H₂" value={fmt(lecturas.H2, ' ppm')} />
              <Row label="CH₄" value={fmt(lecturas.CH4, ' ppm')} />
              <Row label="Ventilador" value={fmt(lecturas.Ventilador, ' %')} />
            </View>

            <Text style={styles.sectionTitle}>Velocidad del ventilador</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={lecturas.Ventilador ?? 0}
              onSlidingComplete={updateFanSpeed}
              minimumTrackTintColor="#1E88E5"
              thumbTintColor="#1565C0"
            />
          </>
        ) : (
          <Text style={{ color: '#757575', marginBottom: 16 }}>
            Sin lecturas aún. Esperando datos en tiempo real…
          </Text>
        )}

        <Text style={styles.sectionTitle}>Acciones</Text>
        <TouchableOpacity style={styles.button} onPress={togglePower}>
          <Text style={styles.buttonText}>{powerOn ? 'Apagar' : 'Encender'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#F44336' }]}
          onPress={handleEliminar}
        >
          <Text style={styles.buttonText}>Eliminar dispositivo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente de fila simple para lecturas
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: '700', color: '#1565C0', marginBottom: 4, marginTop: 8 },
  subtitle: { fontSize: 16, color: '#616161', marginBottom: 16 },
  infoBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#757575', marginTop: 8 },
  value: { fontSize: 16, fontWeight: '500', color: '#212121' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1565C0', marginVertical: 10 },
  button: { backgroundColor: '#1E88E5', padding: 14, borderRadius: 8, alignItems: 'center', marginVertical: 5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: '#757575', fontSize: 14 },
  rowValue: { color: '#1565C0', fontSize: 16, fontWeight: '600' },
});
