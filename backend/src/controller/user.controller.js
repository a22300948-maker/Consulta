const db = require('../config/db');
const { getTaxConfig } = require('../config/tax.config');

function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function getUserProfile(req, res) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  try {
    const user = await queryOne(
      `SELECT id, username, email, full_name AS fullName, address, postal_code AS postalCode, created_at AS createdAt
       FROM users
       WHERE id = ?;`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (err) {
    console.error('getUserProfile error:', err);
    res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
  }
}

async function updateUserProfile(req, res) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  const { fullName, email, address, postalCode } = req.body;
  const updates = [];
  const params = [];

  if (fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(fullName);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    params.push(address);
  }
  if (postalCode !== undefined) {
    updates.push('postal_code = ?');
    params.push(postalCode);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No hay datos para actualizar' });
  }

  try {
    if (email) {
      const existing = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existing) {
        return res.status(409).json({ message: 'El email ya está en uso por otro usuario' });
      }
    }

    params.push(userId);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?;`;
    await queryAll(sql, params);

    const updatedUser = await queryOne(
      `SELECT id, username, email, full_name AS fullName, address, postal_code AS postalCode, created_at AS createdAt
       FROM users
       WHERE id = ?;`,
      [userId]
    );

    res.json(updatedUser);
  } catch (err) {
    console.error('updateUserProfile error:', err);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
}

async function getUserOrders(req, res) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  try {
    const { ivaRate: defaultIvaRate } = getTaxConfig();

    const orders = await queryAll(
      `SELECT id, paypal_order_id AS paypalOrderId, total, iva_rate AS ivaRate, iva_amount AS ivaAmount, total_con_iva AS totalConIva, currency, status, created_at AS createdAt
       FROM pedido
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 15;`,
      [userId]
    );

    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map((order) => order.id);
    const placeholders = orderIds.map(() => '?').join(',');
    const items = await queryAll(
      `SELECT pedido_id AS orderId, producto_id AS productoId, item_name AS itemName, unit_price AS unitPrice, quantity, subtotal
       FROM pedido_item
       WHERE pedido_id IN (${placeholders});`,
      orderIds
    );

    const groupedOrders = orders.map((order) => {
      const baseTotal = Number(order.total);
      const ivaRate = Number.isFinite(Number(order.ivaRate)) ? Number(order.ivaRate) : defaultIvaRate;
      const ivaAmount = Number.isFinite(Number(order.ivaAmount))
        ? Number(order.ivaAmount)
        : roundMoney(baseTotal * ivaRate);
      const totalConIva = Number.isFinite(Number(order.totalConIva))
        ? Number(order.totalConIva)
        : roundMoney(baseTotal + ivaAmount);

      return {
        ...order,
        ivaRate,
        ivaAmount,
        totalConIva,
        items: items.filter((item) => item.orderId === order.id),
      };
    });

    res.json(groupedOrders);
  } catch (err) {
    console.error('getUserOrders error:', err);
    res.status(500).json({ message: 'Error al obtener los pedidos recientes' });
  }
}

module.exports = { getUserProfile, updateUserProfile, getUserOrders };
