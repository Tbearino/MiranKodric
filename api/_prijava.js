/* Skupne nastavitve za prijavo v urejevalnik (ni javna pot: ime se začne s _). */
const crypto = require('crypto');

/* Naslovi, s katerih je prijava dovoljena. Nastavi SITE_ORIGINS v Vercelu,
   npr. "https://miran-kodric.vercel.app,https://www.kondric.si".
   Prvi naslov se uporabi za povratni naslov pri GitHubu. */
const dovoljeniNaslovi = () => {
  const izOkolja = (process.env.SITE_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
  if (izOkolja.length) return izOkolja;
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return prod ? [`https://${prod}`] : [];
};

const naslovZahteve = (req) => {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return host ? `https://${host}` : '';
};

const piskotek = (req, ime) => {
  const vrstica = req.headers.cookie || '';
  for (const del of vrstica.split(';')) {
    const [k, ...v] = del.trim().split('=');
    if (k === ime) return decodeURIComponent(v.join('='));
  }
  return '';
};

const enako = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};

const varnostneGlave = (res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
};

const IME_PISKOTKA = '__Host-urejevalnik-stanje';

module.exports = { dovoljeniNaslovi, naslovZahteve, piskotek, enako, varnostneGlave, IME_PISKOTKA };
