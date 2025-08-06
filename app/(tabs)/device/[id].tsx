import { useEnvioLecturas } from '@/hooks/useEnvioLecturas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  ubicacion: {
    ciudad: string;
    estado: string;
    pais: string;
  };
  estado: string;
};

type Lecturas = {
  Temperatura: number;
  Humedad: number;
  IAQ: number;
  Ventilador: number; // velocidad de 0 a 100
  CO: number;
  PM1_0: number;
  PM2_5: number;
  PM10: number;
  VOCs: number;
  H2: number;
  CH4: number;
};


export default function DetalleDispositivo() {
  const { id } = useLocalSearchParams();
  const deviceId = Array.isArray(id) ? id[0] : id;
  const [device, setDevice] = useState<Dispositivo | null>(null);
  const [lecturas, setLecturas] = useState<Lecturas | null>(null);
  const [loading, setLoading] = useState(true);
  const [powerOn, setPowerOn] = useState(true);
  const dispositivo_id = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const API_BASE = 'http://192.168.0.119:3000';

  useEnvioLecturas(dispositivo_id, lecturas);


  const obtenerDatos = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No se encontró la sesión del usuario');
        return;
      }

      const [deviceRes, lecturaRes] = await Promise.all([
        axios.get(`${API_BASE}/devices/${deviceId}?usuario_id=${userId}`),
        axios.get(`${API_BASE}/readings/${userId}?dispositivo_id=${deviceId}`),
      ]);

      setDevice(deviceRes.data);

    if (lecturaRes.data.length > 0) {
      const lectura = lecturaRes.data[0];
      setLecturas(lectura);
      verificarCalidadAire(lectura.IAQ);
    }
    } catch (error) {
      console.error('Error al obtener datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarDispositivo = async () => {
    Alert.alert(
      'Eliminar dispositivo',
      '¿Estás seguro de eliminar este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE}/devices/${deviceId}`);
              Alert.alert('Eliminado', 'Dispositivo eliminado correctamente');
              router.back();
            } catch (err) {
              console.error('Error al eliminar dispositivo:', err);
              Alert.alert('Error', 'No se pudo eliminar el dispositivo');
            }
          },
        },
      ]
    );
  };

  const togglePower = async () => {
    try {
      const nuevoEstado = !powerOn;
      setPowerOn(nuevoEstado);
      await axios.post(`${API_BASE}/devices/${deviceId}/power`, {
        estado: nuevoEstado ? 'on' : 'off',
      });
    } catch (err) {
      console.error('Error al cambiar estado de encendido:', err);
    }
  };

  const updateFanSpeed = async (value: number) => {
    try {
      setLecturas(prev => (prev ? { ...prev, Ventilador: value } : null));
      await axios.post(`${API_BASE}/devices/${deviceId}/fan`, {
        velocidad: value,
      });
    } catch (err) {
      console.error('Error al actualizar ventilador:', err);
    }
  };

  const verificarCalidadAire = async (iaq: number) => {
  if (iaq > 150) { // puedes ajustar este umbral según tus criterios
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Calidad del aire pobre',
        body: `El valor de IAQ es ${iaq}. Se recomienda ventilar la habitación.`,
        sound: 'default',
      },
      trigger: null, // se dispara inmediatamente
    });
  }
};


  useEffect(() => {
    obtenerDatos();
    (async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No podrás recibir alertas de calidad del aire.');
    }
  })();
  }, []);

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
        <Text style={styles.errorText}>No se encontró el dispositivo</Text>
      </View>
    );
  }

  return (

    <SafeAreaView style={{ flex: 1, backgroundColor: '#E3F2FD' }}>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.title}>{device.nombre}</Text>
        <Text style={styles.subtitle}>{device.modelo}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Ubicación:</Text>
          <Text style={styles.value}>
            {device.ubicacion.ciudad}, {device.ubicacion.estado}, {device.ubicacion.pais}
          </Text>

          <Text style={styles.label}>Estado:</Text>
          <Text style={styles.value}>
            {powerOn ? '🟢 Encendido' : '🔴 Apagado'}
          </Text>
        </View>

        {lecturas && (
          <>
            <Text style={styles.sectionTitle}>Lecturas recientes</Text>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Temperatura:</Text>
              <Text style={styles.value}>{lecturas.Temperatura} °C</Text>

              <Text style={styles.label}>Humedad:</Text>
              <Text style={styles.value}>{lecturas.Humedad} %</Text>

              <Text style={styles.label}>IAQ:</Text>
              <Text style={styles.value}>{lecturas.IAQ}</Text>

              <Text style={styles.label}>Ventilador:</Text>
              <Text style={styles.value}>{lecturas.Ventilador || 0} %</Text>

              <Text style={styles.label}>CO:</Text>
              <Text style={styles.value}>{lecturas.CO} ppm</Text>

              <Text style={styles.label}>PM1.0:</Text>
              <Text style={styles.value}>{lecturas.PM1_0} µg/m³</Text>

              <Text style={styles.label}>PM2.5:</Text>
              <Text style={styles.value}>{lecturas.PM2_5} µg/m³</Text>

              <Text style={styles.label}>PM10:</Text>
              <Text style={styles.value}>{lecturas.PM10} µg/m³</Text>

              <Text style={styles.label}>VOCs:</Text>
              <Text style={styles.value}>{lecturas.VOCs} ppm</Text>

              <Text style={styles.label}>H₂:</Text>
              <Text style={styles.value}>{lecturas.H2} ppm</Text>

              <Text style={styles.label}>CH₄:</Text>
              <Text style={styles.value}>{lecturas.CH4} ppm</Text>
            </View>


            <Text style={styles.sectionTitle}>Velocidad del ventilador</Text>
            <Slider
              value={lecturas.Ventilador}
              minimumValue={0}
              maximumValue={100}
              step={1}
              onSlidingComplete={updateFanSpeed}
              minimumTrackTintColor="#1E88E5"
              thumbTintColor="#1565C0"
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Acciones</Text>
        <TouchableOpacity style={styles.optionBtn} onPress={togglePower}>
          <Text style={styles.optionText}>
            {powerOn ? 'Apagar' : 'Encender'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionBtn, { backgroundColor: '#F44336', marginTop: 10 }]}
          onPress={handleEliminarDispositivo}
        >
          <Text style={styles.optionText}>Eliminar dispositivo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E3F2FD' },
  title: { fontSize: 24, fontWeight: '700', color: '#1565C0', marginBottom: 4, marginTop: 25 },
  subtitle: { fontSize: 16, color: '#616161', marginBottom: 16 },
  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
  },
  label: { fontSize: 14, color: '#757575', marginTop: 10 },
  value: { fontSize: 16, fontWeight: '500', color: '#212121' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#1565C0' },
  optionBtn: {
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#F44336', fontSize: 16 },
  scrollContainer: {
  padding: 20,
  paddingBottom: 80, // espacio para evitar que el botón quede pegado abajo
},

});
