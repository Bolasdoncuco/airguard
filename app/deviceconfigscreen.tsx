import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
// import { useAuth } from '../context/AuthContext'; // Asegúrate de importar tu contexto si ya lo tienes
import { useAuth } from '@/hooks/useAuth'; // Update the path if AuthContext is in the same folder, or correct the path as needed

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth(); // Esto debe venir de tu contexto

  const [device, setDevice] = useState<any>(null);

  useEffect(() => {
    const obtenerDispositivo = async () => {
      try {
        const res = await axios.get(
          `http://192.168.0.119:3000/api/devices/${id}/${userId}`
        );
        setDevice(res.data);
      } catch (error) {
        console.error('Error al obtener dispositivo:', error);
      }
    };

    if (id && userId) {
      obtenerDispositivo();
    }
  }, [id, userId]);

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Cargando dispositivo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{device.nombre}</Text>
      <Text style={styles.subtitle}>
        Ubicación: {device.ubicacion?.ciudad}, {device.ubicacion?.pais}
      </Text>

      <Text style={styles.section}>Estado: {device.estado}</Text>
      <Text style={styles.item}>
        Registrado: {new Date(device.fecha_registro).toLocaleString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#555',
  },
  section: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
    color: '#444',
  },
  item: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
});
