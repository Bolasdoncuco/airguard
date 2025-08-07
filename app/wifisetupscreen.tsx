// app/device-setup/WifiSetupScreen.tsx
import { useAuth } from '@/hooks/useAuth';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import base64 from 'react-native-base64';
import { BleManager, Device } from 'react-native-ble-plx';

const manager = new BleManager();

// UUIDs (minúsculas para comparar fácil)
const SERVICE_UUID     = '0000fff1-0000-1000-8000-00805f9b34fb';
const CHAR_NOTIFY_UUID = '0000bbbb-0000-1000-8000-00805f9b34fb';
const CHAR_WRITE_UUID  = '0000aaaa-0000-1000-8000-00805f9b34fb';

// Tamaño mínimo seguro de write en BLE
const CHUNK_SIZE = 20;

export default function WifiSetupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // ← ID BLE que pasas desde el escaneo
  const { userId } = useAuth();

  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [networks, setNetworks] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string>('Conectando…');
  const [device, setDevice] = useState<Device | null>(null);

  const subRef = useRef<ReturnType<Device['monitorCharacteristicForService']> | null>(null);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'No se recibió el ID del dispositivo BLE.');
      return;
    }

    let mounted = true;

    const connect = async () => {
      try {
        // Permisos Android
        if (Platform.OS === 'android') {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);
        }

        setStatus('Conectando por BLE…');
        const dev = await manager.connectToDevice(id, { autoConnect: true });
        if (!mounted) return;

        // MTU
        try {
          const mtuInfo = await dev.requestMTU(256);
          console.log('🔧 MTU negociado:', mtuInfo);
        } catch (e) {
          console.warn('⚠️ MTU negotiation falló, continuamos');
        }

        await dev.discoverAllServicesAndCharacteristics();
        if (!mounted) return;

        setDevice(dev);
        setStatus(`Conectado a ${dev.name ?? 'dispositivo'}`);

        // Suscribirse a NOTIFY (bbbb)
        subRef.current = dev.monitorCharacteristicForService(
          SERVICE_UUID,
          CHAR_NOTIFY_UUID,
          (error, characteristic) => {
            if (error) {
              console.error('❌ Notificación BLE:', error);
              return;
            }
            if (!characteristic?.value) return;

            const decoded = Buffer.from(characteristic.value, 'base64').toString('utf8').trim();
            if (!decoded) return;

            console.log('📥 NOTIFY:', decoded);

            // Tags de control
            if (decoded === 'scan_start') {
              setStatus('Escaneando redes…');
              return;
            }
            if (decoded === 'scan_done') {
              setStatus('Escaneo terminado');
              return;
            }
            if (decoded === 'no_networks') {
              setStatus('Sin redes encontradas');
              return;
            }
            if (decoded === 'wifi_ok') {
              Alert.alert('Wi-Fi', 'Conexión exitosa');
              return;
            }
            if (decoded === 'wifi_fail') {
              Alert.alert('Wi-Fi', 'No se pudo conectar, revisa la contraseña');
              return;
            }
            if (decoded === 'ready') {
              // opcional: mostrar que el canal de notify está activo
              return;
            }

            // Si no es tag, asumimos SSID
            setNetworks((prev) => (prev.includes(decoded) ? prev : [...prev, decoded]));
          }
        );

        // MUY IMPORTANTE: esperar a que el cliente haya habilitado CCCD en NOTIFY
        setNetworks([]); // limpia resultados previos
        await new Promise((r) => setTimeout(r, 700)); // 500–800ms suele ir bien

        // Pedir escaneo (el firmware ESP32 escaneará y nos mandará SSIDs por NOTIFY)
        try {
          await dev.writeCharacteristicWithResponseForService(
            SERVICE_UUID,
            CHAR_WRITE_UUID,
            base64.encode('scan')
          );
          setStatus('Solicitado scan…');
        } catch (e) {
          console.warn('No se pudo solicitar scan:', e);
          setStatus('No se pudo iniciar el escaneo');
        }
      } catch (err) {
        console.error('❌ Error BLE:', err);
        setStatus('Fallo de conexión BLE');
        Alert.alert('Error', 'No se pudo conectar por BLE');
      }
    };

    connect();

    return () => {
      mounted = false;
      try {
        if (subRef.current) subRef.current.remove();
      } catch {}
      if (device) {
        manager.cancelDeviceConnection(device.id).catch(() => {});
      }
    };
  }, [id]);

  const sendCredentials = async () => {
  if (!device) {
    Alert.alert('Error', 'No hay conexión BLE activa');
    return;
  }
  if (!ssid) {
    Alert.alert('Faltan datos', 'Selecciona una red Wi-Fi');
    return;
  }
  if (!password) {
    Alert.alert('Faltan datos', 'Ingresa la contraseña de la red');
    return;
  }

  setSending(true);
  try {
    // 1) JSON crudo + '\n' (DELIMITADOR)
    const json = {
      ssid,
      password,
      usuario_id: userId,        // de tu sesión
      dispositivo_id: device.id, // id BLE como candidato
    };
    const raw = JSON.stringify(json) + '\n';

    // 2) Trocear **BYTES** y base64 por trozo (NO base64 del todo)
    const bytes = Buffer.from(raw, 'utf8');      // <-- bytes reales
    console.log('📦 Bytes totales a enviar:', bytes.length);

    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const slice = bytes.slice(i, i + CHUNK_SIZE);     // Buffer
      const b64 = slice.toString('base64');             // b64 de ese trozo

      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHAR_WRITE_UUID,
        b64
      );
      await new Promise(r => setTimeout(r, 40)); // respiro para el stack BLE
    }

    Alert.alert('Listo', 'Credenciales enviadas, esperando respuesta…');
    setStatus('Credenciales enviadas');
  } catch (error) {
    console.error('❌ Error al enviar credenciales:', error);
    Alert.alert('Error', 'No se pudo enviar la configuración');
  } finally {
    setSending(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONFIGURAR WI-FI</Text>
      <Text style={styles.status}>{status}</Text>

      {networks.length > 0 ? (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.subtitle}>Redes detectadas:</Text>
          <ScrollView style={{ maxHeight: 240 }}>
            {networks.map((net, idx) => (
              <TouchableOpacity
                key={`${net}-${idx}`}
                onPress={() => setSsid(net)}
                style={[styles.networkItem, ssid === net && styles.selectedNetwork]}
              >
                <Text style={styles.networkText}>{net}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text style={{ color: '#999', marginBottom: 20 }}>🔍 Buscando redes Wi-Fi…</Text>
      )}

      <Text style={styles.inputLabel}>Contraseña para: {ssid || '—'}</Text>
      <TextInput
        placeholder="Contraseña"
        placeholderTextColor="#85C1E9"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        editable={!!ssid}
      />

      <TouchableOpacity onPress={sendCredentials} style={styles.button} disabled={sending || !ssid}>
        {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>ENVIAR CREDENCIALES</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#EAF2F8' },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#1A5276',
    textAlign: 'center', marginTop: 8, marginBottom: 16,
  },
  status: { textAlign: 'center', color: '#1A5276', marginBottom: 12 },
  subtitle: { fontWeight: 'bold', color: '#1A5276', marginBottom: 8, fontSize: 16 },
  inputLabel: { color: '#1A5276', marginBottom: 6 },
  input: {
    backgroundColor: 'white',
    borderColor: '#AED6F1', borderWidth: 1, borderRadius: 8,
    padding: 15, marginBottom: 20, color: '#1A5276', fontSize: 16,
  },
  button: { backgroundColor: '#3498DB', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  networkItem: { padding: 10, borderRadius: 5, backgroundColor: '#D6EAF8', marginBottom: 5 },
  selectedNetwork: { backgroundColor: '#7FB3D5', borderLeftWidth: 4, borderLeftColor: '#1A5276' },
  networkText: { color: '#1A5276' },
});
