const {
  createPaypalOrder,
  capturePaypalOrder,
} = require('../services/paypal.service');
const db = require('../config/db');

// Map temporal para relacionar orderId -> items enviados en create-order
const createdOrders = new Map();

async function createOrder(req, res) {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'El carrito está vacío'
      });
    }

    if (!total || Number(total) <= 0) {
      return res.status(400).json({
        error: 'El total es inválido'
      });
    }

    const order = await createPaypalOrder({ items, total });

    // guardar los items en memoria asociados al id de la orden
    if (order && order.id) {
      createdOrders.set(order.id, items);
    }

    res.status(200).json({
      id: order.id,
      status: order.status
    });
  } catch (error) {
    console.error('Error en createOrder:', error.message);

    res.status(500).json({
      error: 'No se pudo crear la orden',
      detalle: error.message
    });
  }
}

async function captureOrder(req, res) {
  try {
    const orderId = req.body?.orderId ?? req.body?.orderID;

    if (!orderId) {
      return res.status(400).json({
        error: 'orderId es obligatorio'
      });
    }

    const captureData = await capturePaypalOrder(orderId);

    // obtener items asociados a la orden (si existen)
    let items = createdOrders.get(orderId);

    // Si no están en memoria, intentar extraer desde la respuesta de PayPal
    if ((!items || items.length === 0) && captureData?.purchase_units) {
      try {
        items = [];
        for (const pu of captureData.purchase_units) {
          if (Array.isArray(pu.items)) {
            for (const it of pu.items) {
              items.push({ name: it.name, quantity: Number(it.quantity || 1) });
            }
          }
        }
      } catch (e) {
        items = [];
      }
    }

    // Si tenemos items, decrementar stock en la BD de forma segura
    if (items && items.length > 0) {
      // ejecutar actualizaciones en paralelo
      const updates = items.map((it) => {
        return new Promise((resolve, reject) => {
          const qty = Number(it.quantity || 0);
          if (!it.name || qty <= 0) return resolve();
          // actualizar inStock restando la cantidad, sin permitir valores negativos
          const sql = `UPDATE producto SET inStock = CASE WHEN inStock - ? >= 0 THEN inStock - ? ELSE 0 END WHERE name = ?`;
          db.run(sql, [qty, qty, it.name], function (err) {
            if (err) return reject(err);
            resolve(this.changes || 0);
          });
        });
      });

      try {
        await Promise.all(updates);
      } catch (e) {
        console.error('Error actualizando stock:', e);
      }

      // limpiar mapping
      createdOrders.delete(orderId);
    }

    res.status(200).json(captureData);
  } catch (error) {
    console.error('Error en captureOrder:', error.message);

    res.status(500).json({
      error: 'No se pudo capturar la orden',
      detalle: error.message
    });
  }
}

module.exports = { createOrder, captureOrder };
