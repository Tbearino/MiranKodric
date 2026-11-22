/* Števec ogledov knjige (Upstash Redis prek Vercela).
   Isti obiskovalec se šteje največ enkrat na dan: shranimo samo
   zgoščeno vrednost IP naslova (ne IP sam), ki po 24 urah poteče. */
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ ogledi: null }); }

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(503).json({ ogledi: null });

  const redis = async (...ukaz) => {
    const r = await fetch(`${url}/${ukaz.map(encodeURIComponent).join('/')}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error('redis');
    return (await r.json()).result;
  };

  try {
    if (req.query.stej === '1') {
      const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      const dan = new Date().toISOString().slice(0, 10);
      const sol = process.env.OGLEDI_SOL || 'miran-kondric';
      const kljuc = 'ogled:' + crypto.createHash('sha256').update(`${sol}|${dan}|${ip}`).digest('hex').slice(0, 32);
      const nov = await redis('set', kljuc, '1', 'NX', 'EX', '86400');
      if (nov === 'OK') await redis('incr', 'ogledi-knjiga');
    }
    const st = await redis('get', 'ogledi-knjiga');
    return res.status(200).json({ ogledi: Number(st) || 0 });
  } catch (e) {
    return res.status(500).json({ ogledi: null });
  }
};
