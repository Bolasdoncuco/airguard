// WifiSetupScreen.tsx
import { useAuth } from '@/hooks/useAuth';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import base64 from 'react-native-base64';
import { BleManager, Device } from 'react-native-ble-plx';

const manager = new BleManager();
const SERVICE_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
const CHAR_NOTIFY_UUID = '0000bbbb-0000-1000-8000-00805f9b34fb';
const CHAR_WRITE_UUID = '0000aaaa-0000-1000-8000-00805f9b34fb';

export default function WifiSetupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [networks, setNetworks] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
      }
    };

    const reconectar = async () => {
      try {
        await requestPermissions();
        await new Promise((res) => setTimeout(res, 800));

        let d: Device | null = null;
        const cache = await manager.devices([id as string]);
        if (cache.length > 0) {
          d = cache[0];
        } else {
          manager.startDeviceScan(null, null, (error, dev) => {
            if (dev?.id === id) {
              d = dev;
              manager.stopDeviceScan();
            }
          });
          await new Promise((res) => setTimeout(res, 2500));
          manager.stopDeviceScan();
        }

        if (!d) throw new Error('Dispositivo no encontrado');

        const conectado = await manager.connectToDevice(d.id);
        await conectado.discoverAllServicesAndCharacteristics();
        setDevice(conectado);
        console.log('✅ Conectado:', conectado.name);

        const subscription = conectado.monitorCharacteristicForService(
          SERVICE_UUID,
          CHAR_NOTIFY_UUID,
          (error, characteristic) => {
            if (error) {
              console.error('❌ Error en notificación:', error);
              return;
            }
            if (characteristic?.value) {
              const decoded = Buffer.from(characteristic.value, 'base64').toString('utf8');
              if (decoded && !networks.includes(decoded)) {
                setNetworks((prev) => [...prev, decoded]);
                console.log('📶 Red recibida:', decoded);
              }
            }
          }
        );


        // Disparar escaneo manual desde el ESP32
        await conectado.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          CHAR_WRITE_UUID,
          base64.encode('scan')
        );

        return () => subscription.remove();
      } catch (error) {
        console.error('❌ Error al reconectar:', error);
        Alert.alert('Error', 'No se pudo conectar por BLE');
      }
    };

    reconectar();
  }, []);

  const sendCredentials = async () => {
    if (!device || !ssid || !password) {
      Alert.alert('Faltan datos', 'Selecciona red y pon contraseña');
      return;
    }

    setSending(true);
    try {
      const json = {
      ssid,
      password,
      usuario_id: userId,
      dispositivo_id: device.id,
    };

    const payload = base64.encode(JSON.stringify(json));
    console.log('📦 Payload:', json, payload);

    await device.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      CHAR_WRITE_UUID,
      payload
    );


      Alert.alert('Éxito', 'Credenciales enviadas');
    } catch (error) {
      console.error('❌ Error al enviar:', error);
      Alert.alert('Error', 'No se pudo enviar la configuración');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONFIGURAR WI-FI</Text>

      {networks.length > 0 ? (
        <View style={{ marginBottom: 20 }}>
        <Text style={styles.subtitle}>Redes detectadas:</Text>
        <View style={{ maxHeight: 200 }}>
          <ScrollView>
            {networks.map((net, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSsid(net)}
                style={[
                  styles.networkItem,
                  ssid === net && styles.selectedNetwork,
                ]}
              >
                <Text style={styles.networkText}>{net}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      ) : (
        <Text style={{ color: '#999', marginBottom: 20 }}>
          🔍 Buscando redes Wi-Fi...
        </Text>
      )}

      <TextInput
        placeholder="Contraseña"
        placeholderTextColor="#85C1E9"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity
        onPress={sendCredentials}
        style={styles.button}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>ENVIAR CREDENCIALES</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#EAF2F8' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A5276',
    textAlign: 'center',
    marginVertical: 30,
  },
  subtitle: {
    fontWeight: 'bold',
    color: '#1A5276',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#AED6F1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    color: '#1A5276',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  networkItem: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#D6EAF8',
    marginBottom: 5,
  },
  selectedNetwork: {
    backgroundColor: '#7FB3D5',
    borderLeftWidth: 4,
    borderLeftColor: '#1A5276',
  },
  networkText: { color: '#1A5276' },
});
