const nodemailer = require('nodemailer');
const { getMailConfig } = require('../config/mail.config');
const { getTaxConfig } = require('../config/tax.config');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

function roundMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function computeIvaBreakdown(totalSinIva) {
  const { ivaRate } = getTaxConfig();
  const base = Number(totalSinIva);
  const ivaAmount = roundMoney(base * ivaRate);
  const totalConIva = roundMoney(base + ivaAmount);
  return { totalSinIva: base, ivaRate, ivaAmount, totalConIva };
}

function buildReceiptXml({ paypalOrderId, pedidoId, status, currency, total, createdAt, user, items }) {
  const created = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();
  const safeItems = Array.isArray(items) ? items : [];
  const breakdown = computeIvaBreakdown(total);

  const itemsXml = safeItems
    .map((it, idx) => {
      const name = escapeXml(it.itemName ?? it.name ?? 'Producto');
      const quantity = Number(it.quantity ?? 1);
      const unitPrice = Number(it.unitPrice ?? it.unit_price ?? it.price ?? 0);
      const subtotal = Number(it.subtotal ?? (quantity * unitPrice));
      const productoId = it.productoId ?? it.producto_id ?? it.sku ?? it.id ?? '';
      return (
        `    <item index="${idx + 1}">\n` +
        `      <productoId>${escapeXml(productoId)}</productoId>\n` +
        `      <name>${name}</name>\n` +
        `      <quantity>${escapeXml(quantity)}</quantity>\n` +
        `      <unitPrice>${escapeXml(formatMoney(unitPrice))}</unitPrice>\n` +
        `      <subtotal>${escapeXml(formatMoney(subtotal))}</subtotal>\n` +
        `    </item>`
      );
    })
    .join('\n');

  const userId = user?.id ?? '';
  const username = user?.username ?? '';
  const email = user?.email ?? '';
  const fullName = user?.fullName ?? '';
  const address = user?.address ?? '';
  const postalCode = user?.postalCode ?? '';

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<receipt>\n` +
    `  <order>\n` +
    `    <pedidoId>${escapeXml(pedidoId ?? '')}</pedidoId>\n` +
    `    <paypalOrderId>${escapeXml(paypalOrderId ?? '')}</paypalOrderId>\n` +
    `    <status>${escapeXml(status ?? '')}</status>\n` +
    `    <currency>${escapeXml(currency ?? 'MXN')}</currency>\n` +
    `    <total>${escapeXml(formatMoney(total))}</total>\n` +
    `    <totalSinIva>${escapeXml(formatMoney(breakdown.totalSinIva))}</totalSinIva>\n` +
    `    <ivaRate>${escapeXml(formatMoney(breakdown.ivaRate))}</ivaRate>\n` +
    `    <ivaAmount>${escapeXml(formatMoney(breakdown.ivaAmount))}</ivaAmount>\n` +
    `    <totalConIva>${escapeXml(formatMoney(breakdown.totalConIva))}</totalConIva>\n` +
    `    <createdAt>${escapeXml(created)}</createdAt>\n` +
    `    <user>\n` +
    `      <id>${escapeXml(userId)}</id>\n` +
    `      <username>${escapeXml(username)}</username>\n` +
    `      <fullName>${escapeXml(fullName)}</fullName>\n` +
    `      <email>${escapeXml(email)}</email>\n` +
    `      <address>${escapeXml(address)}</address>\n` +
    `      <postalCode>${escapeXml(postalCode)}</postalCode>\n` +
    `    </user>\n` +
    `    <items>\n` +
    (itemsXml ? `${itemsXml}\n` : '') +
    `    </items>\n` +
    `  </order>\n` +
    `</receipt>\n`
  );
}

function buildReceiptHtml({ paypalOrderId, pedidoId, status, currency, total, createdAt, user, items }) {
  const created = createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString();
  const safeItems = Array.isArray(items) ? items : [];
  const breakdown = computeIvaBreakdown(total);

  const rows = safeItems
    .map((it) => {
      const name = escapeHtml(it.itemName ?? it.name ?? 'Producto');
      const quantity = Number(it.quantity ?? 1);
      const unitPrice = Number(it.unitPrice ?? it.unit_price ?? it.price ?? 0);
      const subtotal = Number(it.subtotal ?? (quantity * unitPrice));
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">${name}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(quantity)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">$${escapeHtml(formatMoney(unitPrice))}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">$${escapeHtml(formatMoney(subtotal))}</td>
        </tr>`;
    })
    .join('');

  const greetingName = user?.fullName || user?.username || 'Hola';
  const buyerEmail = user?.email ? escapeHtml(user.email) : '';
  const buyerAddress = user?.address ? escapeHtml(user.address) : '';
  const buyerPostal = user?.postalCode ? escapeHtml(user.postalCode) : '';
  const buyerLine = buyerEmail || buyerAddress || buyerPostal
    ? `
        <div style="background:#fff8e7;border:1px solid #d4b483;border-radius:12px;padding:12px 12px;margin-top:12px;">
          <div style="color:#5a3e1b;font-weight:800;margin-bottom:6px;">Datos del comprador</div>
          ${buyerEmail ? `<div style=\"color:#6d5848;font-size:13px;\"><strong>Correo:</strong> ${buyerEmail}</div>` : ''}
          ${buyerAddress ? `<div style=\"color:#6d5848;font-size:13px;margin-top:4px;\"><strong>Dirección:</strong> ${buyerAddress}</div>` : ''}
          ${buyerPostal ? `<div style=\"color:#6d5848;font-size:13px;margin-top:4px;\"><strong>C.P.:</strong> ${buyerPostal}</div>` : ''}
        </div>
      `
    : '';

  const pedidoLine = pedidoId ? `<div style="color:#7a5b3b;font-size:12px;margin-top:4px;">Pedido #${escapeHtml(pedidoId)}</div>` : '';

  return `
  <div style="margin:0;padding:0;background:#fbf7f0;font-family:Georgia,'Times New Roman',serif;color:#3b2f2f;">
    <div style="max-width:680px;margin:0 auto;padding:24px 12px;">
      <div style="background:#5a3e1b;color:#f8f1e5;border-radius:14px;padding:18px 18px;border:1px solid #d4b483;">
        <div style="font-size:20px;font-weight:800;letter-spacing:1px;font-family:'Cinzel',Georgia,serif;">Walmart Romano</div>
        <div style="opacity:.95;margin-top:6px;">Recibo de compra</div>
        ${pedidoLine}
      </div>

      <div style="background:#fffdf8;border-radius:14px;padding:18px;margin-top:12px;border:1px solid #d7c5a3;">
        <p style="margin:0 0 10px 0;color:#5a3e1b;font-weight:700;">${escapeHtml(greetingName)}, gracias por tu compra.</p>
        <p style="margin:0 0 14px 0;color:#6d5848;line-height:1.5;">Te dejamos el detalle de tu venta y el desglose de IVA para que puedas identificar el monto sin y con impuesto.</p>

        <div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 14px 0;">
          <div style="background:#fff8e7;border:1px solid #d4b483;border-radius:12px;padding:10px 12px;flex:1;min-width:220px;">
            <div style="color:#7a5b3b;font-size:12px;">Orden PayPal</div>
            <div style="color:#3b2f2f;font-weight:800;">${escapeHtml(paypalOrderId ?? '')}</div>
          </div>
          <div style="background:#fff8e7;border:1px solid #d4b483;border-radius:12px;padding:10px 12px;flex:1;min-width:220px;">
            <div style="color:#7a5b3b;font-size:12px;">Estatus</div>
            <div style="color:#3b2f2f;font-weight:800;">${escapeHtml(status ?? '')}</div>
          </div>
        </div>

        ${buyerLine}

        <div style="color:#7a5b3b;font-size:12px;margin-bottom:6px;">Fecha</div>
        <div style="color:#3b2f2f;margin-bottom:14px;">${escapeHtml(created)}</div>

        <table style="width:100%;border-collapse:collapse;border:1px solid #d4b483;border-radius:12px;overflow:hidden;background:#fff;">
          <thead>
            <tr style="background:linear-gradient(180deg,#efe6d1,#e9dbc4);">
              <th style="text-align:left;padding:10px 8px;border-bottom:1px solid #d4b483;color:#5a3e1b;">Producto</th>
              <th style="text-align:center;padding:10px 8px;border-bottom:1px solid #d4b483;color:#5a3e1b;">Cant.</th>
              <th style="text-align:right;padding:10px 8px;border-bottom:1px solid #d4b483;color:#5a3e1b;">Precio</th>
              <th style="text-align:right;padding:10px 8px;border-bottom:1px solid #d4b483;color:#5a3e1b;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `
              <tr>
                <td colspan="4" style="padding:12px 8px;color:#7a5b3b;text-align:center;">(Sin items para mostrar)</td>
              </tr>
            `}
          </tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;margin-top:14px;">
          <div style="min-width:320px;background:#fff8e7;border:1px solid #d4b483;border-radius:14px;padding:12px 14px;">
            <div style="display:flex;justify-content:space-between;gap:12px;color:#5a3e1b;">
              <div style="font-weight:700;">Total (sin IVA)</div>
              <div style="font-weight:800;">$${escapeHtml(formatMoney(breakdown.totalSinIva))} ${escapeHtml(currency ?? 'MXN')}</div>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;margin-top:6px;color:#7a5b3b;">
              <div>IVA (${escapeHtml(Math.round(breakdown.ivaRate * 100))}%)</div>
              <div style="font-weight:800;">$${escapeHtml(formatMoney(breakdown.ivaAmount))} ${escapeHtml(currency ?? 'MXN')}</div>
            </div>
            <div style="height:1px;background:#e4d2b2;margin:10px 0;"></div>
            <div style="display:flex;justify-content:space-between;gap:12px;color:#3a2310;">
              <div style="font-weight:800;">Total (con IVA)</div>
              <div style="font-weight:900;">$${escapeHtml(formatMoney(breakdown.totalConIva))} ${escapeHtml(currency ?? 'MXN')}</div>
            </div>
          </div>
        </div>

        <p style="margin:16px 0 0 0;color:#6d5848;font-size:12px;line-height:1.5;">Adjuntamos tu recibo en XML para tus registros. Si tienes alguna duda con tu compra, responde a este correo.</p>
      </div>

      <div style="margin-top:10px;color:#7a5b3b;font-size:12px;text-align:center;">
        © ${new Date().getFullYear()} Walmart Romano
      </div>
    </div>
  </div>`;
}

function createTransporter() {
  const cfg = getMailConfig();

  if (!cfg.user || !cfg.pass) {
    return { transporter: null, config: cfg, reason: 'EMAIL_USER o EMAIL_PASS no configurados' };
  }

  const baseOptions = {
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };

  const transportOptions = cfg.host
    ? { host: cfg.host, port: cfg.port, secure: cfg.secure, ...baseOptions }
    : { service: 'gmail', ...baseOptions };

  const transporter = nodemailer.createTransport(transportOptions);
  return { transporter, config: cfg, reason: null };
}

async function sendOrderReceiptEmail({ to, subject, html, xml, xmlFilename }) {
  const { transporter, config, reason } = createTransporter();
  if (!transporter) {
    console.warn('[mail] Envío omitido:', reason);
    return { ok: false, skipped: true, reason };
  }

  const attachments = [];
  if (xml) {
    attachments.push({
      filename: xmlFilename || 'recibo.xml',
      content: xml,
      contentType: 'application/xml; charset=utf-8',
    });
  }

  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
    attachments,
  });

  return { ok: true, messageId: info.messageId };
}

module.exports = {
  buildReceiptXml,
  buildReceiptHtml,
  sendOrderReceiptEmail,
};
