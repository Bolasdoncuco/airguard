import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [device, setDevice] = useState<any>(null);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/devices/${id}`);
        setDevice(res.data);
      } catch (err) {
        console.error('Error al obtener dispositivo:', err);
      }
    };

    fetchDevice();
  }, [id]);

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Cargando dispositivo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{device.name}</Text>
      <Text style={styles.subtitle}>Ubicación: {device.location}</Text>

      <Text style={styles.section}>Última medición:</Text>
      <Text style={styles.item}>Temp: {device.lastMeasurement?.temperature} °C</Text>
      <Text style={styles.item}>Humedad: {device.lastMeasurement?.humidity} %</Text>
      <Text style={styles.item}>Calidad aire: {device.lastMeasurement?.airQuality}</Text>
      <Text style={styles.item}>Actualizado: {new Date(device.lastMeasurement?.updatedAt).toLocaleString()}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 16,
  },
  section: {
    fontSize: 20,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  item: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
});
