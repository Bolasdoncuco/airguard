import React, { useEffect, useRef, useState } from 'react';
import {
  Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';

export default function ChatBot() {
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState<{ tipo: string; texto: string }[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  type Chat = {
    _id: string;
    creadoEn: string;
    mensajes: { de: string; texto: string }[];
  };
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const usuarioId = 'invitado123';
  const scrollRef = useRef<ScrollView>(null);

  const formatearRespuesta = (respuesta: any) => {
    if (Array.isArray(respuesta)) {
      return respuesta.map(item => (
        `${item.titulo || 'Sin título'}\n${item.contenido || 'Sin contenido'}`
      )).join('\n\n');
    }
    if (typeof respuesta === 'object' && respuesta !== null) {
      return `${respuesta.titulo || 'Sin título'}\n${respuesta.contenido || 'Sin contenido'}`;
    }
    return respuesta || "No se recibió una respuesta válida";
  };

const obtenerHistorial = async () => {
  try {
    const res = await fetch(`http://10.100.1.73:4000/api/chats/${usuarioId}`);
    const data = await res.json();
    setChats(data);
  } catch (error) {
    console.error('Error al cargar historial:', error);
  }
};

  useEffect(() => {
    if (mostrarHistorial) obtenerHistorial();
  }, [mostrarHistorial]);

  const seleccionarChat = (chat: any) => {
    setChatId(chat._id);
    setHistorial(chat.mensajes.map((m: any) => ({
      tipo: m.de === 'usuario' ? 'user' : 'bot',
      texto: m.texto
    })));
    setMostrarHistorial(false);
  };

  const crearChatNuevo = async () => {
  try {
    const res = await fetch('http://10.100.1.73:4000/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId }),
    });
    const data = await res.json();
    if (data.chatId) {
      setChatId(data.chatId);
      setHistorial([]);
      setMostrarHistorial(false);
    }
  } catch (error) {
    console.error('Error creando nuevo chat:', error);
  }
};

const nuevoChat = () => {
  crearChatNuevo();
};

  const enviarPregunta = async () => {
  if (!mensaje.trim()) return;

  const nuevoHistorial = [...historial, { tipo: 'user', texto: mensaje }];
  setHistorial(nuevoHistorial);
  setMensaje('');
  setCargando(true);

  try {
    const res = await fetch('http://10.100.1.73:4000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, chatId, usuarioId }),
    });

    const data = await res.json();

    const respuestaTexto = formatearRespuesta(data.respuesta);
    setHistorial(h => [...h, { tipo: 'bot', texto: respuestaTexto }]);

    if (!chatId && data.chatId) setChatId(data.chatId);
  } catch (err) {
    setHistorial(h => [...h, { tipo: 'bot', texto: 'Error al conectar con el bot' }]);
  } finally {
    setCargando(false);
  }
};

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [historial, cargando]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={10}
    >
      <Text style={styles.header}>AirGuard assistant</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10, marginBottom: 10 }}>
        <Button 
          title={mostrarHistorial ? 'Ocultar historial' : '☰ Historial'} 
          onPress={() => setMostrarHistorial(!mostrarHistorial)} 
        />
        <Button title="➕ Nuevo chat" onPress={nuevoChat} />
      </View>

      {mostrarHistorial && (
        <View style={styles.historialContainer}>
          {chats.length === 0 ? (
            <Text style={{ textAlign: 'center' }}>No hay chats aún</Text>
          ) : (
            chats.map(chat => (
              <TouchableOpacity 
                key={chat._id} 
                onPress={() => seleccionarChat(chat)} 
                style={styles.historialItem}
              >
                <Text>🗨️ {new Date(chat.creadoEn).toLocaleString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <View style={styles.chatBox}>
        <ScrollView style={{ flex: 1 }} ref={scrollRef}>
          {historial.map((h, i) => (
            <View key={i} style={h.tipo === 'user' ? styles.userMsg : styles.botMsg}>
              <Text style={h.tipo === 'bot' ? styles.botText : null}>
                {h.texto}
              </Text>
            </View>
          ))}

          {cargando && (
            <View style={styles.botMsg}>
              <Text>Escribiendo...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu duda..."
            value={mensaje}
            onChangeText={setMensaje}
            onSubmitEditing={enviarPregunta}
          />
          <Button title="Enviar" onPress={enviarPregunta} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 30 },
  chatBox: { flex: 1, padding: 10 },
  header: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    marginLeft: 10 
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#add8e6',
    padding: 8,
    marginVertical: 2,
    borderRadius: 5,
    maxWidth: '80%',
  },
  botMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6e6e6',
    padding: 8,
    marginVertical: 2,
    borderRadius: 5,
    maxWidth: '80%',
  },
  botText: {
    lineHeight: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginRight: 8,
  },
  historialContainer: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    maxHeight: 150,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  historialItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
});
