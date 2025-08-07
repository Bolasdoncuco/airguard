const express = require('express');
const mongoose = require('mongoose');
const Reading = require('../models/reading');
const Device = require('../models/device'); // <-- importa Device

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const p = { ...req.body };

    // Si falta usuario_id pero viene dispositivo_id, lo resolvemos
    if (!p.usuario_id) {
      if (!p.dispositivo_id) {
        return res.status(400).json({ error: 'Faltan usuario_id o dispositivo_id' });
      }
      const dev = await Device.findById(p.dispositivo_id).select('usuario_id');
      if (!dev) return res.status(400).json({ error: 'Dispositivo no existe' });
      p.usuario_id = dev.usuario_id; // <- derivado del Device
    }

    // Cast a ObjectId
    p.usuario_id     = new mongoose.Types.ObjectId(String(p.usuario_id));
    p.dispositivo_id = new mongoose.Types.ObjectId(String(p.dispositivo_id));

    // Normaliza números
    const nums = ['CO','PM1_0','PM2_5','PM10','Humedad','Temperatura','VOCs','H2','CH4','IAQ','Ventilador'];
    for (const k of nums) if (p[k] != null) p[k] = Number(p[k]);

    const lectura = await Reading.create(p);

    const io = req.app.get('io');
    if (io) {
      io.to(lectura.dispositivo_id.toString()).emit('nuevaLectura', lectura);
      io.to(lectura.usuario_id.toString()).emit('nuevaLecturaUsuario', lectura);
    }

    res.status(201).json(lectura);
  } catch (e) {
    console.error('❌ POST /readings error:', e);
    res.status(500).json({ error: e.message || 'Error interno' });
  }
});

// GET /readings/:usuario_id?dispositivo_id=...
router.get('/:usuario_id', async (req, res) => {
  try {
    const q = { usuario_id: new mongoose.Types.ObjectId(String(req.params.usuario_id)) };
    if (req.query.dispositivo_id) {
      q.dispositivo_id = new mongoose.Types.ObjectId(String(req.query.dispositivo_id));
    }

    const arr = await Reading.find(q).sort({ timestamp: -1 }).limit(50);
    res.json(arr);
  } catch (e) {
    console.error('❌ GET /readings error:', e);
    res.status(500).json({ error: e.message || 'Error interno' });
  }
});

module.exports = router;
