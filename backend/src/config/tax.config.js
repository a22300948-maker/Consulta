function clampRate(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function getTaxConfig() {
  const fallback = 0.16;
  const ivaRate = clampRate(process.env.IVA_RATE ?? process.env.TAX_RATE, fallback);
  return { ivaRate };
}

module.exports = { getTaxConfig };
