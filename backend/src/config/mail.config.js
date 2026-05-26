function parseBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const v = String(value).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function parseIntOr(value, defaultValue) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : defaultValue;
}

function getMailConfig() {
  const host = process.env.EMAIL_HOST ? String(process.env.EMAIL_HOST).trim() : '';
  const port = parseIntOr(process.env.EMAIL_PORT, 465);
  const secure = parseBool(process.env.EMAIL_SECURE, port === 465);

  const user = process.env.EMAIL_USER ? String(process.env.EMAIL_USER).trim() : '';
  const passRaw = process.env.EMAIL_PASS ? String(process.env.EMAIL_PASS) : '';
  const pass = passRaw.replace(/\s+/g, '');

  const from = process.env.EMAIL_FROM ? String(process.env.EMAIL_FROM).trim() : user;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
  };
}

module.exports = { getMailConfig };
