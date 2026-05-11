const { saveVenta } = require('../services/venta.service');

async function createVenta(req, res) {
  try {
    const pedidoId = await saveVenta(req.body);
    return res.status(201).json({ pedidoId, message: 'Venta registrada correctamente' });
  } catch (error) {
    console.error('Error creando venta:', error);
    return res.status(500).json({ error: 'No se pudo guardar la venta', detail: error.message });
  }
}

module.exports = { createVenta };
