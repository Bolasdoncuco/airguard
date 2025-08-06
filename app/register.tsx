import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const router = useRouter();

  const [location, setLocation] = useState<{
  lat: number;
  long: number;
  ciudad: string;
  pais: string;
} | null>(null);

useEffect(() => {
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación');
      return;
    }

    const { coords } = await Location.getCurrentPositionAsync({});
    const geo = await Location.reverseGeocodeAsync(coords);
    const ubicacion = {
      lat: coords.latitude,
      long: coords.longitude,
      ciudad: geo[0]?.city || 'Desconocido',
      pais: geo[0]?.country || 'Desconocido',
    };

    setLocation(ubicacion);
  })();
}, []);

  const handleRegister = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Por favor completa todos los campos');
    return;
  }

  if (!location) {
    Alert.alert('Ubicación', 'Esperando ubicación...');
    return;
  }

  try {
    const res = await axios.post('http://192.168.0.119:3000/auth/register', {
        nombre,
      email,
      password,
      location,
    });

    if (res.data?.userId) {
      Alert.alert('Éxito', 'Usuario creado correctamente');
      router.replace('/login');
    }
  } catch (error: any) {
    console.error('Error al registrar', error);
    if (error.response?.status === 409) {
      Alert.alert('Error', 'Este usuario ya existe');
    } else {
      Alert.alert('Error', 'Ocurrió un error al registrar');
    }
  }
};

// Animaciones
 const [scaleValue] = useState(new Animated.Value(1));
const [shakeValue] = useState(new Animated.Value(0));

const animateButton = () => {
  Animated.sequence([
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true
    }),
    Animated.timing(scaleValue, {
      toValue: 1.05,
      duration: 100,
      useNativeDriver: true
    }),
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true
    })
  ]).start();
};

const shakeAnimation = () => {
  Animated.sequence([
    Animated.timing(shakeValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true
    }),
    Animated.timing(shakeValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true
    }),
    Animated.timing(shakeValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true
    }),
    Animated.timing(shakeValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true
    })
  ]).start();
};

const handlePress = () => {
  animateButton();
  // Agrega tu lógica de registro aquí
  handleRegister();
};

return (
  <View style={styles.container}>
    <Animated.View 
      style={[
        styles.card,
        { transform: [{ translateX: shakeValue }] }
      ]}
    >
      {/* Logo agregado aquí */}
      <Image 
        source={require('../assets/images/logo.png')} // Cambia por la ruta de tu logo
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Únete a nuestra comunidad</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons name="person" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Nombre completo"
          placeholderTextColor="#999"
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
      </View>

      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={styles.loginLink}>Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fafafa'
  },
  icon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333'
  },
  button: {
    backgroundColor: '#4a6bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4a6bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  loginText: {
    color: '#666'
  },
  loginLink: {
    color: '#4a6bff',
    fontWeight: 'bold'
  }
});