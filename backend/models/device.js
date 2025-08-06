const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  nombre: {
    type: String,
    required: true,
  },
  modelo: {
    type: String,
    required: true,
  },
  ubicacion: {
    ciudad: String,
    pais: String,
  },
  estado: {
    type: String,
    default: 'activo',
  },
  fecha_registro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Device', deviceSchema);
// Este archivo define el esquema de un dispositivo IoT en MongoDB usando Mongoose.
// El esquema incluye campos para el nombre del dispositivo, ubicación y la última medición de temperatura, humedad y calidad del aire.