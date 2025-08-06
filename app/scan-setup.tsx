// app/scan-setup.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';

const manager = new BleManager();

const BlueTitle = ({ text }: { text: string }) => (
  <Text style={styles.blueTitle}>{text}</Text>
);

const BlueButton = ({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[styles.blueButton, disabled && styles.disabledButton]}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

export async function requestBluetoothPermissions() {
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);
    const allGranted = Object.values(granted).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) throw new Error('Permisos de Bluetooth no otorgados');
  }
}

export default function ScanSetupScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorShown, setErrorShown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        await requestBluetoothPermissions();

        manager.onStateChange((state) => {
          if (state === State.PoweredOn) {
            scanForDevices();
          } else if (state === State.PoweredOff && !errorShown) {
            Alert.alert('Bluetooth Requerido', '¡Enciende el Bluetooth para conectar con AirGuard! 🔵');
            setErrorShown(true);
          }
          setIsScanning(false);
        }, true);
      } catch (err) {
        if (!errorShown) {
          Alert.alert('Error', 'Se necesitan permisos para usar Bluetooth 🔒');
          setErrorShown(true);
        }
      }
    };

    init();
    return () => {
      manager.stopDeviceScan();
      // No destruir el manager aquí
    };

  }, []);

  const scanForDevices = () => {
    if (isScanning) manager.stopDeviceScan();

    setDevices([]);
    setIsScanning(true);
    setErrorShown(false);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        if (!errorShown) Alert.alert('Error', error.message);
        setErrorShown(true);
        setIsScanning(false);
        return;
      }

      if (device?.name?.startsWith('AirGuard')) {
        setDevices((prev) =>
          prev.some((d) => d.id === device.id) ? prev : [...prev, device]
        );
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 5000);
  };

  const goToWifiSetup = () => {
    if (!selectedDevice) {
      Alert.alert('Selecciona un dispositivo');
      return;
    }

    router.push({
  pathname: '/wifisetupscreen',
  params: {
    id: selectedDevice.id,
    serviceUUID: '0000fff1-0000-1000-8000-00805f9b34fb',
    characteristicUUID: '0000aaaa-0000-1000-8000-00805f9b34fb',
  },
});

  };

  return (
    <View style={styles.container}>
      <BlueTitle text="CONEXIÓN AIRGUARD" />

      <View style={styles.scannerContainer}>
        {isScanning ? (
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="small" color="#2E86C1" />
            <Text style={styles.scanningText}>Buscando dispositivos...</Text>
          </View>
        ) : (
          <BlueButton title="ESCANEAR DISPOSITIVOS" onPress={scanForDevices} />
        )}
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedDevice(item)}
            style={[
              styles.deviceItem,
              selectedDevice?.id === item.id && styles.selectedDevice,
            ]}
          >
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceId}>{item.id}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />

      {selectedDevice && (
        <BlueButton title="CONFIGURAR WIFI" onPress={goToWifiSetup} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF2F8', padding: 20 },
  blueTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A5276',
    textAlign: 'center',
    marginVertical: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scannerContainer: { marginBottom: 20 },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#D6EAF8',
    borderRadius: 8,
  },
  scanningText: { marginLeft: 10, color: '#2874A6' },
  blueButton: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 3,
  },
  disabledButton: { backgroundColor: '#85C1E9' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  listContainer: { paddingBottom: 20 },
  deviceItem: {
    backgroundColor: '#D4E6F1',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedDevice: {
    backgroundColor: '#7FB3D5',
    borderLeftWidth: 5,
    borderLeftColor: '#2E86C1',
  },
  deviceName: { fontWeight: 'bold', color: '#1A5276' },
  deviceId: { fontSize: 12, color: '#5499C7', marginTop: 5 },
});
