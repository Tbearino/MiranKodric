/* =========================================================
   SKUPNO ZA VSE STRANI
   Glava z menijem, noga, prehodi med stranmi, pokrajina v ozadju
   in pomožne funkcije za varen prikaz vsebin.
   Meni spreminjaš samo tukaj (PREDALI).
   ========================================================= */
(() => {
  const PREDALI = [
    { id: 'domov',      ime: 'Domov',       href: 'index.html' },
    { id: 'literatura', ime: 'Literatura',  href: 'literatura.html' },
    { id: 'znanost',    ime: 'Znanost',     href: 'znanost.html' },
    { id: 'zgodovina',  ime: 'Zgodovina',   href: 'zgodovina.html' },
    { id: 'para',       ime: 'Para NT',     href: 'para-nt.html' },
    { id: 'projekti',   ime: 'Projekti',    href: 'projekti.html' },
    { id: 'pravila',    ime: 'Pravila',     href: 'pravila.html' },
    { id: 'povezave',   ime: 'Povezave',    href: 'povezave.html' }
  ];
  const EMAIL = 'miran.kondric@fsp.uni-lj.si';

  /* ---------- Pomožne funkcije (uporablja jih tudi vsebina.js) ---------- */
  const el = (tag, lastnosti = {}, ...otroci) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(lastnosti)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const o of otroci.flat()) if (o != null && o !== false) e.append(o);
    return e;
  };

  /* Dovoli samo varne povezave: https, http, mailto in poti znotraj strani */
  const varnaPovezava = (url) => {
    if (typeof url !== 'string') return '';
    const u = url.trim();
    if (!u) return '';
    if (/^(https?:|mailto:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith('//')) return ''; // javascript:, data: …
    return u;
  };
  /* Slike samo z naše strani (naložene prek urejevalnika ali v mapi slike/) */
  const varnaSlika = (pot) => {
    if (typeof pot !== 'string') return '';
    const p = pot.trim().replace(/^\//, '');
    return /^slike\/[\w\-./% ]+\.(jpe?g|png|webp|gif|avif|svg)$/i.test(p) && !p.includes('..') ? p : '';
  };
  const zunanja = (url) => /^https?:/i.test(url) && !url.startsWith(location.origin);
  const povezava = (url, vsebina, razred) => {
    const href = varnaPovezava(url);
    if (!href) return el('span', { class: razred }, vsebina);
    const a = el('a', { class: razred, href }, vsebina);
    if (zunanja(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };
  const brezSumnikov = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const datumSl = (d) => {
    if (!d) return '';
    const x = new Date(d);
    return isNaN(x) ? String(d) : x.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  /* Markdown -> varen HTML (marked + DOMPurify, naložena samo na straneh, ki ju rabijo) */
  const md = (besedilo, vrstica = false) => {
    const t = String(besedilo || '');
    if (!window.marked || !window.DOMPurify) {
      return t.split(/\n{2,}/).map(o => el('p', { text: o })); // varen nadomestek
    }
    const html = vrstica ? marked.parseInline(t) : marked.parse(t);
    const cisto = DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input', 'button'], FORBID_ATTR: ['style'] });
    const ovoj = document.createElement('template');
    ovoj.innerHTML = cisto;
    ovoj.content.querySelectorAll('a[href]').forEach(a => {
      const href = varnaPovezava(a.getAttribute('href'));
      if (!href) { a.replaceWith(...a.childNodes); return; }
      if (zunanja(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    });
    ovoj.content.querySelectorAll('img').forEach(i => {
      const src = varnaSlika(i.getAttribute('src'));
      if (!src) i.remove(); else { i.src = src; i.loading = 'lazy'; }
    });
    ovoj.content.querySelectorAll('table').forEach(t => {
      const o = el('div', { class: 'tabela-ovoj' }); t.replaceWith(o); o.append(t);
    });
    return [...ovoj.content.childNodes];
  };

  const naloziJSON = async (ime) => {
    const r = await fetch(`vsebina/${ime}.json`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`Vsebine ${ime} ni bilo mogoče naložiti.`);
    return r.json();
  };

  window.MK = { el, varnaPovezava, varnaSlika, povezava, brezSumnikov, datumSl, md, naloziJSON, PREDALI };

  /* ---------- Glava ---------- */
  const stran = document.body.dataset.stran || '';
  const glava = document.getElementById('glava');
  if (glava) {
    const vrstica = (glava.dataset.vrstica || 'Zapisi o športu in zgodovini|Radenci, Ljubljana').split('|');
    const prva = PREDALI.find(p => p.id === stran)?.ime || 'Domov';
    glava.replaceChildren(
      el('div', { class: 'vrstica' }, el('span', { text: prva }), el('span', { text: vrstica[0] }), el('span', { text: vrstica[1] || '' })),
      el('hr', { class: 'enojna' }),
      el('a', { class: 'ime', href: 'index.html', text: 'Miran Kondrič' }),
      el('hr', { class: 'dvojna' }),
      el('nav', { 'aria-label': 'Glavna navigacija' },
        el('ul', {}, PREDALI.map(p => el('li', {},
          el('a', { href: p.href, 'aria-current': p.id === stran ? 'page' : null, text: p.ime }))))),
      el('hr', { class: 'enojna' })
    );
  }

  /* ---------- Noga ---------- */
  const noga = document.getElementById('kontakt');
  if (noga && !noga.children.length) {
    const leto = new Date().getFullYear();
    noga.append(el('div', { class: 'wrap' },
      el('div', { class: 'noga-mreza' },
        el('div', {},
          el('h2', { text: 'Pišite mi' }),
          el('p', { text: 'Za vprašanja o knjigah, projektih ali zgodovini namiznega tenisa.' }),
          el('a', { class: 'email', href: `mailto:${EMAIL}`, text: EMAIL })),
        el('div', {},
          el('h3', { text: 'Naslov' }),
          el('p', {}, 'Fakulteta za šport', el('br'), 'Gortanova 22', el('br'), '1000 Ljubljana')),
        el('div', {},
          el('h3', { text: 'Predali' }),
          el('ul', { class: 'noga-predali' }, PREDALI.slice(1).map(p => el('li', {}, el('a', { href: p.href, text: p.ime })))))),
      el('div', { class: 'spodaj' }, el('span', { text: `© ${leto} Miran Kondrič` }), el('a', { href: '#', text: 'Na vrh' }))));
  }

  /* ---------- Okrasne slike: če datoteke ni, jo skrij ---------- */
  document.querySelectorAll('img.risba, .ozadje-pokrajina img').forEach(img => {
    const skrij = () => (img.closest('.ozadje-pokrajina') || img).remove();
    if (img.complete && img.naturalWidth === 0) skrij();
    else img.addEventListener('error', skrij, { once: true });
  });

  /* ---------- Pokrajina v ozadju (parallax) ---------- */
  const pokrajina = document.querySelector('.ozadje-pokrajina img');
  if (pokrajina && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let caka = false;
    addEventListener('scroll', () => {
      if (caka) return; caka = true;
      requestAnimationFrame(() => {
        const y = Math.min(scrollY * 0.12, innerHeight * 0.6);
        pokrajina.style.transform = `translate3d(-50%, ${-y}px, 0)`;
        caka = false;
      });
    }, { passive: true });
  }

  /* ---------- Prehodi med stranmi ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || url.pathname.startsWith('/admin')) return;
    e.preventDefault();
    document.body.classList.add('odhajam');
    setTimeout(() => { location.href = url.href; }, 280);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('odhajam'); });
})();
