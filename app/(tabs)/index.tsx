import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function Home() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendURL = 'http://10.100.1.77:3000/devices';

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(backendURL);
        if (!response.ok) {
          throw new Error('Error al obtener dispositivos');
        }
        const data = await response.json();
        setDevices(data);
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
      onPress={() => router.push(`/device/${item._id}`)}
    >
      <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>{item.name}</Text>
      <Text style={[styles.subtitle, isDark ? styles.textDark : styles.textLight]}>
        Ubicación: {item.location}
      </Text>
      {item.lastMeasurement && (
        <Text style={[styles.info, isDark ? styles.textDark : styles.textLight]}>
          Temp: {item.lastMeasurement.temperature}°C | Humedad: {item.lastMeasurement.humidity}%
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, isDark ? styles.backgroundDark : styles.backgroundLight]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark ? styles.backgroundDark : styles.backgroundLight]}>
      {devices.length === 0 ? (
        <View style={[styles.center, { flex: 1 }]}>
          <Text style={[styles.emptyText, isDark ? styles.textDark : styles.textLight]}>
            No hay dispositivos disponibles.
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Aquí podrías navegar a la pantalla de agregar dispositivo
              Alert.alert('Agregar dispositivo', 'Función para agregar dispositivo aún no implementada.');
            }}
          >
            <Text style={styles.addButtonText}>Agregar dispositivo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 30, padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  backgroundLight: { backgroundColor: '#f0f0f0' },
  backgroundDark: { backgroundColor: '#121212' },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  cardLight: { backgroundColor: '#fff' },
  cardDark: { backgroundColor: '#1e1e1e' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  info: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  textLight: { color: '#222' },
  textDark: { color: '#ddd' },
  emptyText: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
