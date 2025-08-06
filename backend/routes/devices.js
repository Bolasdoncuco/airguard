const express = require('express');
const router = express.Router();
const Device = require('../models/device');

// Estado en memoria (NO se guarda en MongoDB)
const estadosDispositivos = {}; // { [dispositivo_id]: { encendido: true, ventilador: 60 } }

// ✅ Obtener dispositivos por usuario
router.get('/:usuario_id', async (req, res) => {
  try {
    const dispositivos = await Device.find({ usuario_id: req.params.usuario_id });
    res.json(dispositivos);
  } catch (err) {
    console.error('❌ Error al obtener dispositivos:', err);
    res.status(500).json({ error: 'Error al obtener los dispositivos' });
  }
});

// ✅ Obtener un dispositivo por ID (con validación de usuario)
router.get('/:dispositivo_id', async (req, res) => {
  const usuario_id = req.query.usuario_id;
  if (!usuario_id) return res.status(400).json({ error: 'Falta usuario_id en query' });

  try {
    const dispositivo = await Device.findOne({
      _id: req.params.dispositivo_id,
      usuario_id,
    });

    if (!dispositivo) return res.status(404).json({ error: 'Dispositivo no encontrado' });

    res.json(dispositivo);
  } catch (err) {
    console.error('❌ Error al obtener dispositivo:', err);
    res.status(500).json({ error: 'Error al obtener el dispositivo' });
  }
});

// ✅ Registrar dispositivo desde el ESP32
router.post('/registrar', async (req, res) => {
  const { usuario_id, nombre, modelo, ubicacion } = req.body;

  if (!usuario_id || !nombre || !modelo) {
    return res.status(400).json({ error: 'Faltan campos requeridos: usuario_id, nombre o modelo' });
  }

  try {
    // Buscar si ya existe uno con mismo usuario y nombre
    const existente = await Device.findOne({ usuario_id, nombre });

    if (existente) {
      return res.status(200).json({ mensaje: 'Dispositivo ya registrado', dispositivo_id: existente._id });
    }

    const nuevo = await Device.create({
      usuario_id,
      nombre,
      modelo,
      ubicacion,
    });

    // Inicializar estado en memoria
    estadosDispositivos[nuevo._id] = { encendido: false, ventilador: 0 };

    res.status(201).json({ mensaje: 'Dispositivo registrado', dispositivo_id: nuevo._id });
  } catch (err) {
    console.error('❌ Error al registrar dispositivo:', err);
    res.status(500).json({ error: 'Error al registrar el dispositivo' });
  }
});

// ✅ Eliminar dispositivo
router.delete('/:id', async (req, res) => {
  try {
    await Device.findByIdAndDelete(req.params.id);
    delete estadosDispositivos[req.params.id];
    res.json({ mensaje: 'Dispositivo eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar dispositivo' });
  }
});

// ✅ Actualizar estado de encendido (en memoria)
router.post('/:id/power', (req, res) => {
  const { estado } = req.body;
  const id = req.params.id;

  if (!['on', 'off'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido. Usa "on" o "off"' });
  }

  if (!estadosDispositivos[id]) {
    estadosDispositivos[id] = { encendido: false, ventilador: 0 };
  }

  estadosDispositivos[id].encendido = estado === 'on';

  console.log(`⚡ [${id}] Encendido → ${estado}`);
  res.json({ mensaje: `Estado actualizado en memoria a ${estado}` });
});

// ✅ Actualizar velocidad del ventilador (en memoria)
router.post('/:id/fan', (req, res) => {
  const { velocidad } = req.body;
  const id = req.params.id;

  if (typeof velocidad !== 'number' || velocidad < 0 || velocidad > 100) {
    return res.status(400).json({ error: 'Velocidad inválida (0–100)' });
  }

  if (!estadosDispositivos[id]) {
    estadosDispositivos[id] = { encendido: false, ventilador: 0 };
  }

  estadosDispositivos[id].ventilador = velocidad;

  console.log(`🌬️ [${id}] Velocidad → ${velocidad}%`);
  res.json({ mensaje: `Velocidad actualizada en memoria a ${velocidad}%` });
});

// ✅ Obtener estado actual (usado por ESP32)
router.get('/:id/status', (req, res) => {
  const id = req.params.id;

  const estado = estadosDispositivos[id] || {
    encendido: false,
    ventilador: 0,
  };

  res.json(estado);
});

module.exports = router;
