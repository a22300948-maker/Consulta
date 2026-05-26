const db = require('../config/db');
const { getTaxConfig } = require('../config/tax.config');

function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function normalizeItem(item) {
  const quantity = Number(item.quantity ?? item.cantidad ?? 0);
  const unitPrice = Number(item.unit_price ?? item.price ?? item.precio ?? 0);
  const rawSku = String(item.sku ?? item.productoId ?? item.productId ?? item.id ?? '').trim();
  const parsedSku = rawSku === '' ? null : Number(rawSku);
  const itemName = item.item_name ?? item.name ?? item.nombre ?? 'Producto';
  const subtotal = Number(item.subtotal ?? quantity * unitPrice);

  return {
    productoId: parsedSku !== null && Number.isInteger(parsedSku) ? parsedSku : null,
    itemName,
    unitPrice,
    quantity,
    subtotal,
  };
}

async function saveVenta({ paypalOrderId, total, currency = 'MXN', status = 'COMPLETED', items, receiptXml = null, rawPayload = null, userId = null }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Se requieren items de compra');
  }

  const normalizedItems = items.map(normalizeItem);
  const invalidItem = normalizedItems.find((item) => !Number.isInteger(item.quantity) || item.quantity <= 0);
  if (invalidItem) {
    throw new Error('Todos los items deben tener quantity mayor a 0');
  }

  const totalNumber = Number(total);
  if (Number.isNaN(totalNumber) || totalNumber <= 0) {
    throw new Error('Total inválido');
  }

  const { ivaRate } = getTaxConfig();
  const ivaAmount = roundMoney(totalNumber * ivaRate);
  const totalConIva = roundMoney(totalNumber + ivaAmount);

  await runAsync('BEGIN TRANSACTION;');
  try {
    const insertPedidoSQL = `
      INSERT INTO pedido
        (paypal_order_id, total, iva_rate, iva_amount, total_con_iva, currency, status, receipt_xml, receipt_downloaded_at, raw_payload, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    // Ya no descargamos el XML en el cliente; se envía por correo.
    const receiptDownloadedAt = null;
    const { lastID: pedidoId } = await runAsync(insertPedidoSQL, [
      paypalOrderId || null,
      totalNumber,
      ivaRate,
      ivaAmount,
      totalConIva,
      currency,
      status,
      receiptXml || null,
      receiptDownloadedAt,
      rawPayload ? JSON.stringify(rawPayload) : null,
      userId || null,
    ]);

    for (const item of normalizedItems) {
      await runAsync(
        `INSERT INTO pedido_item (pedido_id, producto_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?);`,
        [pedidoId, item.productoId, item.itemName, item.unitPrice, item.quantity, item.subtotal]
      );

      if (item.productoId) {
        await runAsync(
          `UPDATE producto SET inStock = CASE WHEN inStock - ? >= 0 THEN inStock - ? ELSE 0 END WHERE id_prod = ?;`,
          [item.quantity, item.quantity, item.productoId]
        );
      } else {
        await runAsync(
          `UPDATE producto SET inStock = CASE WHEN inStock - ? >= 0 THEN inStock - ? ELSE 0 END WHERE name = ?;`,
          [item.quantity, item.quantity, item.itemName]
        );
      }
    }

    await runAsync('COMMIT;');
    return pedidoId;
  } catch (err) {
    await runAsync('ROLLBACK;');
    throw err;
  }
}

module.exports = { saveVenta };
