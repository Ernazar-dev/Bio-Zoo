// URL maydonlari uchun xavfsizlik tekshiruvi.
// javascript:, data:, vbscript: kabi sxemalar href/iframe orqali
// stored-XSS ga olib keladi — faqat http(s) va nisbiy yo'llarga ruxsat.
const isSafeUrl = (value) => {
  if (value === undefined || value === null || value === '') return true; // ixtiyoriy maydon
  if (typeof value !== 'string' || value.length > 2000) return false;
  const v = value.trim();
  if (v.startsWith('/')) return true; // nisbiy yo'l (masalan /api/files/..)
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

// Matn maydonini tekshiradi: string bo'lishi va uzunlikdan oshmasligi kerak
const isText = (value, max = 500) =>
  value === undefined || value === null || (typeof value === 'string' && value.length <= max);

module.exports = { isSafeUrl, isText };
