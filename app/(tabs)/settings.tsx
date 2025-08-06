import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View
} from 'react-native';

export default function SettingsScreen() {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);

  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('¿Cerrar sesión?', 'Se cerrará tu sesión de AirGuard.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleAyuda = () => {
    Linking.openURL('https://airguard-ayuda.com');
  };

  const handleTerminos = () => {
    Linking.openURL('https://airguard-ayuda.com/terminos');
  };

  const handlePoliticas = () => {
    Linking.openURL('https://airguard-ayuda.com/politicas');
  };

  const handleEstadoServidor = () => {
    Linking.openURL('https://status.airguard-ayuda.com');
  };

  const styles = createStyles(isDark);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Configuración de la App</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Notificaciones generales</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Solo actualizar con WiFi</Text>
        <Switch value={wifiOnly} onValueChange={setWifiOnly} />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Tema del sistema</Text>
        <Text style={styles.value}>
          {isDark ? 'Modo oscuro' : 'Modo claro'} (automático)
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Versión de la App</Text>
        <Text style={styles.value}>v1.0.0</Text>
      </View>

      <View style={styles.block}>
        <Button title="Ayuda" onPress={handleAyuda} color="#2980b9" />
      </View>

      <View style={styles.block}>
        <Button title="Términos y Condiciones" onPress={handleTerminos} color="#2980b9" />
      </View>

      <View style={styles.block}>
        <Button title="Política de Privacidad" onPress={handlePoliticas} color="#2980b9" />
      </View>

      <View style={styles.block}>
        <Button title="Estado del Servidor" onPress={handleEstadoServidor} color="#27ae60" />
      </View>

      <View style={styles.block}>
        <Button title="Cerrar sesión" color="#e74c3c" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: isDark ? '#121212' : '#f0f0f0',
      minHeight: '100%',
      marginTop: 30,
      flexGrow: 1,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: isDark ? '#fff' : '#000',
    },
    block: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 12,
      elevation: 2,
    },
    label: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    value: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#555',
    },
  });
}
