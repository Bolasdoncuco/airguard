const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const devicesRoutes = require('./routes/devices');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const readingRoutes = require('./routes/reading');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/devices', devicesRoutes);
app.use('/readings', readingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en puerto ${PORT}`);
});
