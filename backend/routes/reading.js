const express = require('express');
const router = express.Router();
const Reading = require('../models/reading'); // Asegúrate que exista este modelo

// ✅ Obtener lecturas por usuario_id
router.get('/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;

  if (!usuario_id) {
    return res.status(400).json({ error: 'Falta usuario_id en la ruta' });
  }

  try {
    const lecturas = await Reading.find({ usuario_id }).sort({ timestamp: -1 });
    res.json(lecturas);
  } catch (err) {
    console.error('❌ Error al obtener lecturas:', err);
    res.status(500).json({ error: 'Error al obtener lecturas' });
  }
});

module.exports = router;
