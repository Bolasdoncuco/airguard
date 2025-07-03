import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Button,
  Alert,
  useColorScheme,
  ScrollView,
} from 'react-native';

export default function SettingsScreen() {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('¿Cerrar sesión?', 'Se cerrará tu sesión de AirGuard.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => console.log('Sesión cerrada') },
    ]);
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
