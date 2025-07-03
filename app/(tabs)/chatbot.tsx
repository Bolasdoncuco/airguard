import React, { useEffect, useRef, useState } from 'react';
import {
  Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, 
  Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      const res = await fetch(`http://10.100.1.3:4000/api/chats/${usuarioId}`);
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
      const res = await fetch('http://10.100.1.3:4000/api/chats', {
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

  const borrarHistorial = async () => {
    try {
      await fetch(`http://10.100.1.3:4000/api/chats/usuario/${usuarioId}`, {
        method: 'DELETE',
      });
      setTimeout(() => {
        setChats([]);
        setHistorial([]);
        setChatId(null);
        setMostrarHistorial(false);
      }, 200);
    } catch (error) {
      console.error('Error al borrar historial:', error);
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
      const res = await fetch('http://10.100.1.3:4000/api/chat', {
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
      {/* Header con logo y título */}
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/40' }} 
          style={styles.logo} 
        />
        <Text style={styles.headerTitle}>AirGuard Assistant</Text>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => setMostrarHistorial(!mostrarHistorial)}
        >
          <Ionicons 
            name={mostrarHistorial ? 'close' : 'time'} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={nuevoChat}
        >
          <Ionicons name="add" size={20} color="#2F80ED" />
          <Text style={styles.actionButtonText}>Nuevo chat</Text>
        </TouchableOpacity>
        
        {chats.length > 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ffecec' }]}
            onPress={borrarHistorial}
          >
            <Ionicons name="trash" size={20} color="#EB5757" />
            <Text style={[styles.actionButtonText, { color: '#EB5757' }]}>Borrar todo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Historial de chats */}
      {mostrarHistorial && (
        <View style={styles.historialContainer}>
          <Text style={styles.historialTitle}>Tus conversaciones</Text>
          
          {chats.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="chatbubbles" size={40} color="#ccc" />
              <Text style={styles.emptyHistoryText}>No hay chats recientes</Text>
            </View>
          ) : (
            <ScrollView>
              {chats.map(chat => (
                <TouchableOpacity 
                  key={chat._id} 
                  onPress={() => seleccionarChat(chat)} 
                  style={styles.historialItem}
                >
                  <Ionicons name="chatbox" size={20} color="#2F80ED" />
                  <View style={styles.historialItemContent}>
                    <Text style={styles.historialItemDate}>
                      {new Date(chat.creadoEn).toLocaleDateString()}
                    </Text>
                    <Text numberOfLines={1} style={styles.historialItemPreview}>
                      {chat.mensajes[0]?.texto || 'Nueva conversación'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Área de chat */}
      <View style={styles.chatBox}>
        <ScrollView 
          style={styles.messagesContainer} 
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {historial.length === 0 && !cargando && (
            <View style={styles.welcomeContainer}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/100' }} 
                style={styles.welcomeImage} 
              />
              <Text style={styles.welcomeTitle}>¡Hola! Soy AirGuard Assistant</Text>
              <Text style={styles.welcomeText}>¿En qué puedo ayudarte hoy?</Text>
            </View>
          )}

          {historial.map((h, i) => (
            <View 
              key={i} 
              style={[
                styles.messageBubble, 
                h.tipo === 'user' ? styles.userBubble : styles.botBubble
              ]}
            >
              {h.tipo === 'bot' && (
                <Image 
                  source={{ uri: 'https://via.placeholder.com/30' }} 
                  style={styles.botAvatar} 
                />
              )}
              <View style={h.tipo === 'bot' ? styles.botMessageContent : styles.userMessageContent}>
                <Text style={h.tipo === 'bot' ? styles.botText : styles.userText}>
                  {h.texto}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}

          {cargando && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/30' }} 
                style={styles.botAvatar} 
              />
              <View style={styles.botMessageContent}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={styles.typingText}>Escribiendo...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Área de entrada */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor="#999"
            value={mensaje}
            onChangeText={setMensaje}
            onSubmitEditing={enviarPregunta}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={enviarPregunta}
            disabled={!mensaje.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={mensaje.trim() ? "#2F80ED" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2F80ED',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginTop: 30,
  },
  historyButton: {
    padding: 5,
    marginTop: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f3ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#2F80ED',
    fontWeight: '500',
  },
  historialContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 15,
    maxHeight: 300,
    elevation: 3,
  },
  historialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyHistoryText: {
    marginTop: 10,
    color: '#999',
  },
  historialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historialItemContent: {
    flex: 1,
    marginLeft: 10,
  },
  historialItemDate: {
    fontSize: 12,
    color: '#666',
  },
  historialItemPreview: {
    marginTop: 2,
    color: '#333',
  },
  chatBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  welcomeImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: 8,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  botMessageContent: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 15,
    borderBottomLeftRadius: 0,
    elevation: 1,
  },
  userMessageContent: {
    backgroundColor: '#2F80ED',
    padding: 12,
    borderRadius: 15,
    borderBottomRightRadius: 0,
  },
  botText: {
    color: '#333',
    lineHeight: 20,
  },
  userText: {
    color: 'white',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 5,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    marginLeft: 10,
    padding: 8,
  },
});