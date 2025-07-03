const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const devicesRoutes = require('./routes/devices');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/devices', devicesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en puerto ${PORT}`);
});
