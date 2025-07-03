import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import axios from 'axios';

export default function DeviceSetupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const handleAddDevice = async () => {
    try {
      await axios.post('http://localhost:3000/devices', {
        name,
        location,
        lastMeasurement: {
          temperature: 0,
          humidity: 0,
          airQuality: 0,
          updatedAt: new Date().toISOString(),
        },
      });

      router.replace('/'); // Volvemos al Home
    } catch (error) {
      console.error('Error al agregar dispositivo:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar nuevo AirGuard</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del dispositivo"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Ubicación"
        placeholderTextColor="#aaa"
        value={location}
        onChangeText={setLocation}
      />

      <Button title="Agregar dispositivo" onPress={handleAddDevice} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
});
