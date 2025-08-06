import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const enviarLectura = async (lectura: any) => {
  try {
    const res = await fetch('http://192.168.0.119:3000/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lectura),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('❌ Error al guardar lectura:', error);
    } else {
      console.log('✅ Lectura enviada correctamente');
    }
  } catch (err) {
    console.error('❌ Error en la solicitud:', err);
  }
};

export function useEnvioLecturas(dispositivo_id: string | null, lecturas: any) {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const iniciarEnvio = async () => {
      try {
        const userStr = await AsyncStorage.getItem('usuarioLogueado');
        if (!userStr) return;

        const usuario = JSON.parse(userStr);
        if (!usuario._id || !dispositivo_id || !lecturas) return;

        intervalId = setInterval(() => {
          console.log('📤 Enviando lectura...');
          enviarLectura({
            usuario_id: usuario._id,
            dispositivo_id,
            ...lecturas,
          });
        }, 30000);
      } catch (err) {
        console.error('❌ Error iniciando envío de lecturas:', err);
      }
    };

    iniciarEnvio();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [dispositivo_id, lecturas]);
}
