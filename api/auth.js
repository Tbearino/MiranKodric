/* Korak 1 prijave v urejevalnik: preusmeri na GitHub.
   Ustvari naključno stanje (zaščita pred CSRF) in ga shrani v varen piškotek. */
const crypto = require('crypto');
const { dovoljeniNaslovi, naslovZahteve, varnostneGlave, IME_PISKOTKA } = require('./_prijava');

module.exports = (req, res) => {
  varnostneGlave(res);
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).send('Metoda ni dovoljena.'); }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const naslovi = dovoljeniNaslovi();
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET || !naslovi.length) {
    return res.status(500).send('Prijava v urejevalnik še ni nastavljena.');
  }
  if (!naslovi.includes(naslovZahteve(req))) return res.status(403).send('Prijava s tega naslova ni dovoljena.');
  if (req.query.provider && req.query.provider !== 'github') return res.status(400).send('Neznan ponudnik prijave.');

  const stanje = crypto.randomBytes(32).toString('hex');
  res.setHeader('Set-Cookie', `${IME_PISKOTKA}=${stanje}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${naslovi[0]}/api/callback`,
    scope: process.env.GITHUB_SCOPE || 'public_repo', // javni repozitorij; za zasebnega nastavi "repo"
    state: stanje,
    allow_signup: 'false'
  });
  res.setHeader('Location', `https://github.com/login/oauth/authorize?${params}`);
  return res.status(302).end();
};
