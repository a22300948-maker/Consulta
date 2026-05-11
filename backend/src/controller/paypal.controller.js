const {
  createPaypalOrder,
  capturePaypalOrder,
} = require('../services/paypal.service');
const { saveVenta } = require('../services/venta.service');

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

    let items = createdOrders.get(orderId);

    if ((!items || items.length === 0) && captureData?.purchase_units) {
      items = [];
      for (const pu of captureData.purchase_units) {
        if (Array.isArray(pu.items)) {
          for (const it of pu.items) {
            items.push({
              sku: it.sku ?? null,
              name: it.name,
              quantity: Number(it.quantity || 1),
              price: Number(it.unit_amount?.value || 0),
              subtotal: Number(it.unit_amount?.value || 0) * Number(it.quantity || 1),
            });
          }
        }
      }
    }

    if (items && items.length > 0) {
      const purchaseUnit = captureData?.purchase_units?.[0] ?? null;
      const captureAmountValue = purchaseUnit?.amount?.value
        ?? purchaseUnit?.payments?.captures?.[0]?.amount?.value;
      const currency = purchaseUnit?.amount?.currency_code
        ?? purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code
        ?? 'MXN';
      const total = Number(captureAmountValue ?? items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0));

      if (Number.isNaN(total) || total <= 0) {
        console.error('captureOrder: total inválido extraído de PayPal', {
          purchaseUnit,
          items,
          totalCandidate: captureAmountValue,
        });
        return res.status(500).json({
          error: 'No se pudo guardar la venta, total inválido',
          detalle: 'Total inválido extraído del pago'
        });
      }

      await saveVenta({
        paypalOrderId: orderId,
        total,
        currency,
        status: captureData?.status ?? 'COMPLETED',
        items,
        rawPayload: captureData,
      });
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
