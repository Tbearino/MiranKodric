/* Korak 2 prijave v urejevalnik: GitHub vrne kodo, ki jo zamenjamo za žeton.
   - preveri stanje iz piškotka (CSRF),
   - po želji dovoli samo naštete GitHub uporabnike (ALLOWED_GITHUB_USERS),
   - žeton pošlje samo oknu urejevalnika na dovoljenem naslovu. */
const crypto = require('crypto');
const { dovoljeniNaslovi, naslovZahteve, piskotek, enako, varnostneGlave, IME_PISKOTKA } = require('./_prijava');

const stran = (res, sporocilo, cilj) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  // JSON v <script>: nevtraliziraj </script> in posebne znake
  const varno = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`);
  res.setHeader('Set-Cookie', `${IME_PISKOTKA}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  res.status(200).send(`<!doctype html><html lang="sl"><head><meta charset="utf-8"><title>Prijava</title></head>
<body><p>Prijava v urejevalnik … To okno se bo zaprlo samo.</p>
<script nonce="${nonce}">
(function () {
  var sporocilo = ${varno(sporocilo)};
  var cilj = ${varno(cilj)};
  if (!window.opener || !cilj) { document.body.textContent = 'Prijava ni uspela. Zaprite to okno in poskusite znova.'; return; }
  window.addEventListener('message', function (e) {
    if (e.origin !== cilj || e.source !== window.opener || e.data !== 'authorizing:github') return;
    window.opener.postMessage(sporocilo, cilj);
    setTimeout(function () { window.close(); }, 200);
  });
  window.opener.postMessage('authorizing:github', cilj);
})();
</script></body></html>`);
};

const napaka = (res, cilj, besedilo) =>
  stran(res, 'authorization:github:error:' + JSON.stringify({ message: besedilo }), cilj);

module.exports = async (req, res) => {
  varnostneGlave(res);
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).send('Metoda ni dovoljena.'); }

  const naslovi = dovoljeniNaslovi();
  const cilj = naslovZahteve(req);
  if (!naslovi.includes(cilj)) return res.status(403).send('Prijava s tega naslova ni dovoljena.');

  const { code, state, error } = req.query;
  if (error) return napaka(res, cilj, 'Prijava je bila preklicana.');
  if (!code || !enako(state, piskotek(req, IME_PISKOTKA))) return napaka(res, cilj, 'Prijava je potekla. Poskusite znova.');

  const clientId = process.env.GITHUB_CLIENT_ID;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: secret, code, redirect_uri: `${naslovi[0]}/api/callback` })
    });
    const podatki = await r.json();
    const token = podatki.access_token;
    if (!token) return napaka(res, cilj, 'GitHub ni potrdil prijave.');

    // Samo dovoljeni uporabniki (npr. "Tbearino,mirankondric")
    const dovoljeni = (process.env.ALLOWED_GITHUB_USERS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (dovoljeni.length) {
      const u = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'miran-kondric-urejevalnik' } });
      const uporabnik = u.ok ? await u.json() : {};
      if (!dovoljeni.includes(String(uporabnik.login || '').toLowerCase())) {
        // žeton takoj prekličemo
        await fetch(`https://api.github.com/applications/${clientId}/token`, {
          method: 'DELETE',
          headers: { Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'), Accept: 'application/vnd.github+json', 'User-Agent': 'miran-kondric-urejevalnik' },
          body: JSON.stringify({ access_token: token })
        }).catch(() => {});
        return napaka(res, cilj, 'Ta GitHub račun nima dostopa do urejevalnika.');
      }
    }

    return stran(res, 'authorization:github:success:' + JSON.stringify({ token, provider: 'github' }), cilj);
  } catch (e) {
    return napaka(res, cilj, 'Prijava trenutno ni mogoča. Poskusite znova čez nekaj minut.');
  }
};
