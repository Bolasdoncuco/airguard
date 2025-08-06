import { useAuth } from '@/hooks/useAuth';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://192.168.0.119:3000/auth/login', {
      email,
      password
    });

    if (res.data?.userId) {
      await AsyncStorage.setItem('userId', res.data.userId);
      login(res.data.userId); // usando useAuth
      router.replace('/');
    }
    } catch (err: any) {
        if (err.response?.status === 401) {
            Alert.alert('Error', 'Correo o contraseña incorrectos');
        } else {
            Alert.alert('Error', 'No se pudo iniciar sesión');
        }
        console.error('Error al iniciar sesión', err);
    }

  };

   const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Animación de entrada
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true
    }).start();
  }, []);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  const handlePress = () => {
    animateButton();
    handleLogin();
    // Removed unused setShowPassword function
        throw new Error('Function not implemented.');
    }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <Image 
          source={require('../assets/images/logo.png')} // Cambia por tu logo
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Bienvenido de vuelta</Text>
        <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>

        {/* Campo Email */}
        <View style={[
          styles.inputContainer,
          isFocused.email && styles.inputFocused
        ]}>
          <MaterialIcons 
            name="email" 
            size={20} 
            color={isFocused.email ? '#4a6bff' : '#999'} 
            style={styles.icon} 
          />
          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setIsFocused({...isFocused, email: true})}
            onBlur={() => setIsFocused({...isFocused, email: false})}
          />
        </View>

        {/* Campo Contraseña */}
        <View style={[
          styles.inputContainer,
          isFocused.password && styles.inputFocused
        ]}>
          <Feather 
            name="lock" 
            size={20} 
            color={isFocused.password ? '#4a6bff' : '#999'} 
            style={styles.icon} 
          />
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry={!showPassword}
            onFocus={() => setIsFocused({...isFocused, password: true})}
            onBlur={() => setIsFocused({...isFocused, password: false})}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Feather 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color="#999" 
            />
          </TouchableOpacity>
        </View>

        {/* Botón de Olvidé contraseña */}
        <TouchableOpacity style={styles.forgotPassword}
          onPress={async () => {
            if (!email) {
              Alert.alert('Correo requerido', 'Por favor ingresa tu correo para recuperar tu contraseña.');
              return;
            }

            try {
              const res = await axios.post('http://192.168.0.120:3000/auth/forgot-password', {
                email,
              });

              Alert.alert(
                'Revisa tu correo',
                'Te hemos enviado instrucciones para recuperar tu contraseña.'
              );
            } catch (error: any) {
              if (error.response?.status === 404) {
                Alert.alert('Error', 'No existe una cuenta con ese correo.');
              } else {
                Alert.alert('Error', 'Ocurrió un problema al recuperar tu contraseña.');
              }
              console.error('Error al recuperar contraseña', error);
            }
          }}
        >
        <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* Botón de Login */}
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Enlace a Registro */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => router.replace('/register')}>
            <Text style={styles.registerLink}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    height: 50,
  },
  inputFocused: {
    borderColor: '#4a6bff',
    shadowColor: '#4a6bff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#4a6bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4a6bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#4a6bff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
