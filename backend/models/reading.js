const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dispositivo_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  CO: Number,
  PM1_0: Number,
  PM2_5: Number,
  PM10: Number,
  Humedad: Number,
  Temperatura: Number,
  VOCs: Number,
  H2: Number,
  CH4: Number,
  IAQ: Number,
});

module.exports = mongoose.model('Reading', readingSchema);
