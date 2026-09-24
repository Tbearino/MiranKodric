module.exports = async (req, res) => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const ukaz = req.query.stej === '1' ? 'incr' : 'get';
  try {
    const r = await fetch(`${url}/${ukaz}/ogledi-knjiga`, { headers: { Authorization: `Bearer ${token}` } });
    const { result } = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ogledi: Number(result) || 0 });
  } catch (e) {
    res.status(500).json({ ogledi: null });
  }
};