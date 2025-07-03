const express = require('express');
const router = express.Router();
const Device = require('../models/device');

router.get('/', async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
    console.log('🟢 Dispositivos obtenidos:', devices);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Error obteniendo dispositivos' });
  }
});

module.exports = router;

