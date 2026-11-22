/* =========================================================
   PRIKAZ VSEBIN IZ UREJEVALNIKA
   Vsak predal prebere svojo datoteko iz mape vsebina/ in jo izriše.
   Vse besedilo gre na stran kot besedilo (textContent), markdown pa
   skozi DOMPurify, zato vsebina ne more vstaviti škodljive kode.
   ========================================================= */
(() => {
  const { el, povezava, varnaSlika, varnaPovezava, brezSumnikov, datumSl, md, naloziJSON } = window.MK;
  const stran = document.body.dataset.stran;
  const cilj = document.getElementById('vsebina');

  const prazno = (besedilo) => el('p', { class: 'prazno', text: besedilo });
  const napaka = () => prazno('Vsebine trenutno ni bilo mogoče naložiti. Osvežite stran čez nekaj trenutkov.');
  const uvod = (t) => { const u = document.getElementById('uvod'); if (u && t) u.replaceChildren(...md(t)); };
  const poDatumu = (a, b) => String(b.datum || b.leto || '').localeCompare(String(a.datum || a.leto || ''));
  const slika = (pot, alt = '', razred) => { const s = varnaSlika(pot); return s ? el('img', { src: s, alt, loading: 'lazy', class: razred }) : null; };

  /* Iskalnik: vpisano besedilo poišče po vseh poljih, brez šumnikov */
  const iskalnik = (oznaka, naIskanje) => {
    const id = `isci-${stran}`;
    const vnos = el('input', { type: 'search', id, placeholder: 'Vpišite besedo, avtorja, leto …', autocomplete: 'off' });
    let t;
    vnos.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => naIskanje(brezSumnikov(vnos.value).trim()), 120); });
    return el('div', { class: 'iskalnik' }, el('label', { for: id, text: oznaka }), vnos);
  };
  const ujema = (iskano, ...polja) => !iskano || iskano.split(/\s+/).every(b => brezSumnikov(polja.join(' ')).includes(b));

  /* Kartica (Projekti, Pravila, domača stran) */
  const kartica = (k, { datum = true } = {}) => {
    const href = varnaPovezava(k.povezava);
    const foto = slika(k.slika, '', 'foto') || el('div', { class: 'brez-foto', 'aria-hidden': 'true' });
    const vsebina = el('div', { class: 'k-vsebina' },
      datum && k.datum ? el('time', { datetime: k.datum, text: datumSl(k.datum) }) : null,
      el('h3', { text: k.naslov }),
      k.opis ? el('p', { text: k.opis }) : null,
      href ? el('span', { class: 'vec', text: 'Več' }) : null);
    if (!href) return el('article', { class: 'kartica' }, foto, vsebina);
    const a = povezava(href, [foto, vsebina], 'kartica');
    return a;
  };

  const RISALCI = {
    /* ---------------- DOMOV ---------------- */
    async domov() {
      const [d, proj, zn] = await Promise.all([
        naloziJSON('domov'),
        naloziJSON('projekti').catch(() => ({ projekti: [] })),
        naloziJSON('znanost').catch(() => ({ objave: [] }))]);
      const $ = (id) => document.getElementById(id);
      if (d.uvod_oznaka) $('d-oznaka').textContent = d.uvod_oznaka;
      if (d.uvod_naslov) $('d-naslov').textContent = d.uvod_naslov;
      if (d.uvod_besedilo) $('d-besedilo').replaceChildren(...md(d.uvod_besedilo));
      const s = varnaSlika(d.uvod_slika);
      if (s) { $('d-slika').src = s; $('d-podnapis').textContent = d.uvod_podnapis || ''; }
      else $('d-slika').closest('figure').remove();
      if (d.o_avtorju) $('d-avtor').replaceChildren(...md(d.o_avtorju));
      if (Array.isArray(d.casovnica)) $('d-casovnica').replaceChildren(...d.casovnica.map(c =>
        el('li', {}, el('span', { class: 'l', text: c.leto }), el('span', { text: c.dogodek }))));

      const novi = (proj.projekti || []).filter(p => p.objavljeno !== false && p.naslov).sort(poDatumu).slice(0, 3);
      if (novi.length) { $('d-novo').hidden = false; $('d-novo-mreza').replaceChildren(...novi.map(k => kartica(k))); }
      const clanki = (zn.objave || []).filter(o => o.citat).sort(poDatumu).slice(0, 3);
      if (clanki.length) {
        $('d-znanost').hidden = false;
        $('d-znanost-seznam').replaceChildren(...clanki.map(o => el('li', {},
          el('span', { class: 'leto', text: o.leto || '' }), el('p', { class: 'citat' }, ...md(o.citat, true)))));
      }
    },

    /* ---------------- LITERATURA ---------------- */
    async literatura() {
      const d = await naloziJSON('literatura'); uvod(d.uvod);
      const knjige = (d.knjige || []).filter(k => k.naslov).sort(poDatumu);
      if (!knjige.length) return cilj.replaceChildren(prazno('Knjige bodo kmalu dodane.'));
      cilj.replaceChildren(el('ol', { class: 'knjige' }, knjige.map(k => {
        const href = varnaPovezava(k.povezava);
        const naslovnica = slika(k.naslovnica, `Naslovnica: ${k.naslov}`) ||
          el('div', { class: 'brez-naslovnice', 'aria-hidden': 'true' }, el('span', { text: k.naslov }));
        return el('li', { class: 'knjiga' },
          href ? povezava(href, naslovnica, 'knjiga-naslovnica') : el('div', { class: 'knjiga-naslovnica' }, naslovnica),
          el('div', { class: 'knjiga-podatki' },
            el('p', { class: 'knjiga-oznaka', text: [k.leto, k.vrsta].filter(Boolean).join(' · ') }),
            el('h2', {}, href ? povezava(href, k.naslov) : k.naslov),
            k.avtorji ? el('p', { class: 'knjiga-avtorji', text: k.avtorji }) : null,
            k.opis ? el('p', { text: k.opis }) : null,
            href ? el('div', { class: 'gumbi' }, povezava(href, k.bralnik ? 'Preberi na spletu' : 'Več o knjigi', 'gumb polno')) : null));
      })));
    },

    /* ---------------- ZNANOST ---------------- */
    async znanost() {
      const d = await naloziJSON('znanost'); uvod(d.uvod);
      const vse = (d.objave || []).filter(o => o.citat).sort(poDatumu);
      if (!vse.length) return cilj.replaceChildren(prazno('Objave bodo kmalu dodane.'));
      const seznam = el('ol', { class: 'objave' });
      const stevec = el('p', { class: 'stevec-zadetkov', 'aria-live': 'polite' });
      const samoMoji = el('input', { type: 'checkbox', id: 'samo-avtorski' });
      let iskano = '';
      const izris = () => {
        const zadetki = vse.filter(o => (!samoMoji.checked || o.avtorski) && ujema(iskano, o.citat, o.leto, o.kljucne_besede, o.abstrakt));
        stevec.textContent = `Prikazanih ${zadetki.length} od ${vse.length} objav`;
        seznam.replaceChildren(...(zadetki.length ? zadetki.map(o => el('li', { class: 'objava' },
          el('span', { class: 'leto', text: o.leto || '' }),
          el('div', {},
            el('p', { class: 'citat' }, ...md(o.citat, true)),
            el('div', { class: 'objava-dodatki' },
              o.avtorski ? el('span', { class: 'znacka', text: 'Avtorski članek' }) : null,
              varnaPovezava(o.povezava) ? povezava(o.povezava, 'Odpri članek', 'odpri') : null),
            o.kljucne_besede ? el('p', { class: 'kljucne', text: o.kljucne_besede }) : null,
            o.abstrakt ? el('details', { class: 'abstrakt' }, el('summary', { text: 'Povzetek' }), el('div', {}, ...md(o.abstrakt))) : null))) :
          [el('li', { class: 'prazno', text: 'Ni zadetkov. Poskusite z drugo besedo.' })]));
      };
      samoMoji.addEventListener('change', izris);
      cilj.replaceChildren(
        el('div', { class: 'orodja' },
          iskalnik('Iskanje po objavah', v => { iskano = v; izris(); }),
          el('label', { class: 'stikalo', for: 'samo-avtorski' }, samoMoji, 'Samo avtorski članki')),
        stevec, seznam);
      izris();
    },

    /* ---------------- ZGODOVINA ---------------- */
    async zgodovina() {
      const d = await naloziJSON('zgodovina'); uvod(d.uvod);
      const poglavja = (d.poglavja || []).filter(p => p.naslov);
      if (!poglavja.length) return cilj.replaceChildren(prazno('Zgodovina je v pripravi.'));
      const id = (i) => `poglavje-${i + 1}`;
      const tabela = (besedilo) => {
        const vrstice = String(besedilo || '').split(/\r?\n/).map(v => v.trimEnd()).filter(Boolean);
        if (vrstice.length < 2) return null;
        const loci = vrstice[0].includes('\t') ? '\t' : vrstice[0].includes(';') ? ';' : '|';
        const celice = vrstice.map(v => v.split(loci).map(c => c.trim()));
        return el('div', { class: 'tabela-ovoj' }, el('table', {},
          el('thead', {}, el('tr', {}, celice[0].map(c => el('th', { scope: 'col', text: c })))),
          el('tbody', {}, celice.slice(1).map(v => el('tr', {}, v.map(c => el('td', { text: c })))))));
      };
      cilj.replaceChildren(
        poglavja.length > 1 ? el('nav', { class: 'poglavja-kazalo', 'aria-label': 'Poglavja' },
          poglavja.map((p, i) => el('a', { href: `#${id(i)}`, text: p.naslov }))) : '',
        ...poglavja.map((p, i) => el('section', { class: 'poglavje', id: id(i) },
          el('h2', { text: p.naslov }),
          varnaSlika(p.slika) ? el('figure', { class: 'okvir' }, slika(p.slika, p.podnapis || ''), p.podnapis ? el('figcaption', { text: p.podnapis }) : null) : null,
          el('div', { class: 'clanek' }, ...md(p.besedilo)),
          tabela(p.tabela))));
    },

    /* ---------------- PARA NT ---------------- */
    async para() {
      const d = await naloziJSON('para'); uvod(d.uvod);
      const vse = (d.clanki || []).filter(c => c.naslov).sort(poDatumu);
      if (!vse.length) return cilj.replaceChildren(prazno('Članki bodo kmalu dodani.'));
      const mreza = el('div', { class: 'izrezki-mreza' });
      const stevec = el('p', { class: 'stevec-zadetkov', 'aria-live': 'polite' });
      const izris = (iskano = '') => {
        const z = vse.filter(c => ujema(iskano, c.naslov, c.vir, c.opis, c.datum));
        stevec.textContent = `Prikazanih ${z.length} od ${vse.length} člankov`;
        mreza.replaceChildren(...(z.length ? z.map(c => el('article', { class: 'izrezek' },
          slika(c.izrezek, `Časopisni izrezek: ${c.naslov}`, 'izrezek-slika'),
          el('div', { class: 'izrezek-besedilo' },
            el('p', { class: 'izrezek-vir', text: [c.vir, datumSl(c.datum)].filter(Boolean).join(' · ') }),
            el('h3', {}, varnaPovezava(c.povezava) ? povezava(c.povezava, c.naslov) : c.naslov),
            c.opis ? el('p', { text: c.opis }) : null))) : [prazno('Ni zadetkov. Poskusite z drugo besedo.')]));
      };
      cilj.replaceChildren(el('div', { class: 'orodja' }, iskalnik('Iskanje po člankih', izris)), stevec, mreza);
      izris();
    },

    /* ---------------- PROJEKTI ---------------- */
    async projekti() {
      const d = await naloziJSON('projekti'); uvod(d.uvod);
      const vidni = (d.projekti || []).filter(p => p.objavljeno !== false && p.naslov).sort(poDatumu);
      cilj.replaceChildren(vidni.length ? el('div', { class: 'kartice' }, vidni.map(k => kartica(k))) : prazno('Novice o projektih bodo objavljene tukaj.'));
    },

    /* ---------------- PRAVILA ---------------- */
    async pravila() {
      const d = await naloziJSON('pravila'); uvod(d.uvod);
      const vsa = (d.pravila || []).filter(p => p.naslov);
      cilj.replaceChildren(vsa.length ? el('div', { class: 'kartice' }, vsa.map(k => kartica(k, { datum: false }))) : prazno('Pravila bodo kmalu dodana.'));
    },

    /* ---------------- POVEZAVE ---------------- */
    async povezave() {
      const d = await naloziJSON('povezave'); uvod(d.uvod);
      const vse = (d.povezave || []).filter(p => p.ime && varnaPovezava(p.povezava));
      if (!vse.length) return cilj.replaceChildren(prazno('Povezave bodo kmalu dodane.'));
      const skupine = new Map();
      vse.forEach(p => { const s = p.skupina || 'Ostalo'; if (!skupine.has(s)) skupine.set(s, []); skupine.get(s).push(p); });
      const zacetnice = (ime) => ime.replace(/\(.*?\)/g, '').split(/\s+/).filter(b => /^[A-ZČŠŽ]/.test(b)).slice(0, 2).map(b => b[0]).join('') || ime[0];
      cilj.replaceChildren(...[...skupine].map(([ime, seznam]) => el('section', { class: 'povezave-skupina' },
        skupine.size > 1 ? el('h2', { text: ime }) : null,
        el('ul', { class: 'povezave' }, seznam.map(p => el('li', {},
          povezava(p.povezava, [
            slika(p.logo, '', 'logo') || el('span', { class: 'monogram', 'aria-hidden': 'true', text: zacetnice(p.ime) }),
            el('span', { class: 'p-besedilo' },
              el('strong', { text: p.ime }),
              p.opis ? el('span', { text: p.opis }) : null,
              el('span', { class: 'p-naslov', text: varnaPovezava(p.povezava).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') }))
          ], 'povezava')))))));
    }
  };

  if (RISALCI[stran]) RISALCI[stran]().catch(() => { if (cilj) cilj.replaceChildren(napaka()); });
})();
