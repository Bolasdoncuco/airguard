const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: String,
  location: String,
  lastMeasurement: {
    temperature: Number,
    humidity: Number,
    airQuality: Number,
    updatedAt: Date,
  },
});

module.exports = mongoose.model('Device', deviceSchema);
// Este archivo define el esquema de un dispositivo IoT en MongoDB usando Mongoose.
// El esquema incluye campos para el nombre del dispositivo, ubicación y la última medición de temperatura, humedad y calidad del aire.