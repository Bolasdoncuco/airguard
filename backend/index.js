// index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./db');

const devicesRoutes = require('./routes/devices');
const authRoutes = require('./routes/auth');
const readingRoutes = require('./routes/reading'); // <-- aquí vive POST/GET de readings

require('dotenv').config();

const app = express();
connectDB();

app.use(cors({ origin: '*'}));
app.use(express.json());

// Rutas REST
app.use('/auth', authRoutes);
app.use('/devices', devicesRoutes);
app.use('/readings', readingRoutes);

// Health para pruebas
app.get('/health', (req, res) => res.send('ok'));

// --- SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Guarda io para usarlo en los routers con req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 WS conectado: ${socket.id}`);

  // Únete a rooms por ID en crudo (strings)
  socket.on('joinUser', (uid) => {
    if (!uid) return;
    socket.join(String(uid));
  });

  socket.on('joinDevice', (did) => {
    if (!did) return;
    socket.join(String(did));
  });

  socket.on('leaveDevice', (did) => {
    if (!did) return;
    socket.leave(String(did));
  });

  socket.on('disconnect', () => {
    console.log(`❌ WS desconectado: ${socket.id}`);
  });
});

// Middleware de errores (para respuestas 500 consistentes)
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  res.status(500).json({ error: err.message || 'Error interno' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend (HTTP+WS) escuchando en puerto ${PORT}`);
});
