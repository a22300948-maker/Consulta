const db = require('../config/db');

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

async function saveVenta({ paypalOrderId, total, currency = 'MXN', status = 'COMPLETED', items, receiptXml = null, rawPayload = null }) {
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

  await runAsync('BEGIN TRANSACTION;');
  try {
    const insertPedidoSQL = `
      INSERT INTO pedido
        (paypal_order_id, total, currency, status, receipt_xml, receipt_downloaded_at, raw_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const receiptDownloadedAt = receiptXml ? new Date().toISOString() : null;
    const { lastID: pedidoId } = await runAsync(insertPedidoSQL, [
      paypalOrderId || null,
      totalNumber,
      currency,
      status,
      receiptXml || null,
      receiptDownloadedAt,
      rawPayload ? JSON.stringify(rawPayload) : null,
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
