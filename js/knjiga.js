/* Bralnik knjige: listanje, kazalo, lupa, števec ogledov */
(() => {
/* =========================================================
   NASTAVITVE KNJIGE
   Strani so slike v mapi knjiga/strani/ (001.webp, 002.webp …).
   ========================================================= */
const KNJIGA = {
  strani: 308,
  pot: 'knjiga/strani/',
  koncnica: '.webp',
  sirina: 869, visina: 1228,   // velikost ene strani (za razmerje)
  slike: null                   // samo za predogled; pusti null
};

/* Poglavja: [naslov, stran] */
const POGLAVJA = [
  ['Predgovor',8],['Športna dejavnost ob Muri',9],['Športni klub Mura',10],['Prvi zapisi o namiznem tenisu',13],
  ['Koloman Györy',15],['Marica Cimperman',15],['Erži Jonaš',16],['Gabi Kardoš',16],['Ludvik Nemec',17],
  ['Janez Nemec o začetkih namiznega tenisa',18],['Janez Nemec in časopis Düplin',20],['Janez Nemec, sourednik časopisa Düplin',21],
  ['Janez Nemec o sebi',24],['Namizni tenis v Murski Soboti med obema vojnama',44],['Prekmurci in razvoj namiznega tenisa',46],
  ['Pismo Janeza Nemca Dragu Stepišniku',51],['Janez Nemec o Maksu Marinku',54],['Športni uspehi Janeza Nemca',57],
  ['Galerija namiznoteniških uspehov',60],['Foto utrinki iz življenja',66],['Janez Nemec in družbena dejavnost',71],
  ['Delovanje na VEKŠ-u',72],['Razne anekdote',73],['Janez Nemec v časopisih',75],['Bibliografija v COBISS-u',293],
  ['Stvarno kazalo',299],['Viri',300],['Seznam fotografij',301],['Recenziji',304]
];


const N = KNJIGA.slike ? KNJIGA.slike.length : KNJIGA.strani;
const oder = document.getElementById('knjiga-oder');
const vnos = document.getElementById('st-strani');
document.getElementById('skupaj').textContent = N;
vnos.max = N;

const pot = i => KNJIGA.slike ? KNJIGA.slike[i] : KNJIGA.pot + String(i+1).padStart(3,'0') + KNJIGA.koncnica;

/* Pripravi prazne strani; slike se naložijo šele, ko so blizu */
const el = document.createElement('div');
for (let i=0;i<N;i++){
  const s = document.createElement('div');
  s.className = 'stran';
  if (i===0 || i===N-1) s.dataset.density = 'hard';
  const img = document.createElement('img');
  img.alt = 'Stran ' + (i+1);
  img.decoding = 'async';
  img.onload = () => img.classList.add('nalozena');
  s.appendChild(img);
  el.appendChild(s);
}
oder.appendChild(el);
const slike = [...el.querySelectorAll('img')];

function naloziOkoli(idx){
  for (let i=idx-2; i<=idx+6; i++){
    if (i<0 || i>=N) continue;
    const img = slike[i];
    if (!img.getAttribute('src')) img.src = pot(i);
  }
}

let flip = null;
if (window.St){
  flip = new St.PageFlip(el, {
    width: 500, height: Math.round(500*KNJIGA.visina/KNJIGA.sirina),
    size:'stretch', minWidth:240, maxWidth:1000, minHeight:340, maxHeight:1450,
    showCover:true, maxShadowOpacity:.35, mobileScrollSupport:false, flippingTime:700
  });
  flip.loadFromHTML(el.querySelectorAll('.stran'));
  const osvezi = () => { const i = flip.getCurrentPageIndex(); vnos.value = i+1; naloziOkoli(i); };
  flip.on('flip', osvezi);
  flip.on('changeOrientation', osvezi);
  osvezi();
} else {
  oder.textContent = 'Bralnika ni bilo mogoče naložiti. Osvežite stran.';
}

function pojdiNa(stran){
  if (!flip) return;
  const i = Math.min(Math.max(stran,1),N) - 1;
  naloziOkoli(i);
  flip.turnToPage(i);
  vnos.value = i+1;
}

document.getElementById('nazaj').onclick = () => flip && flip.flipPrev();
document.getElementById('naprej').onclick = () => flip && flip.flipNext();
vnos.addEventListener('change', () => pojdiNa(parseInt(vnos.value,10)||1));
document.getElementById('celo').onclick = () => {
  const b = document.getElementById('beri');
  if (document.fullscreenElement) document.exitFullscreen();
  else if (b.requestFullscreen) b.requestFullscreen();
};
document.addEventListener('keydown', e => {
  if (!flip || e.target === vnos) return;
  const r = document.getElementById('beri').getBoundingClientRect();
  if (r.top > innerHeight || r.bottom < 0) return;
  if (e.key==='ArrowLeft') flip.flipPrev();
  if (e.key==='ArrowRight') flip.flipNext();
});

/* Kazalo */
const kazalo = document.getElementById('kazalo');
POGLAVJA.forEach(([naslov, stran]) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<span class="n"></span><span class="pike"></span><span class="s">${stran}</span>`;
  b.querySelector('.n').textContent = naslov;
  b.onclick = () => {
    if (stran > N){ document.getElementById('beri').scrollIntoView(); return; }
    document.getElementById('beri').scrollIntoView();
    pojdiNa(stran);
  };
  li.appendChild(b); kazalo.appendChild(li);
});
oder.addEventListener('contextmenu', e => e.preventDefault());
(async () => {
  const el = document.getElementById('ogledi');
  let stej = false;
  try { stej = !localStorage.getItem('videl-knjigo'); } catch(e){}
  try {
    const r = await fetch('/api/ogledi' + (stej ? '?stej=1' : ''));
    const { ogledi } = await r.json();
    if (ogledi) {
      el.textContent = ogledi.toLocaleString('sl-SI');
      el.parentElement.hidden = false;
    }
    if (stej) localStorage.setItem('videl-knjigo', '1');
  } catch(e){}
})();
document.addEventListener('fullscreenchange', () => setTimeout(() => flip && flip.update(), 60));
(() => {
  const POVECAVA = 2.2;
  const HD = 'knjiga/strani-hd/';
  const lupa = document.getElementById('lupa');
  const gumb = document.getElementById('lupa-gumb');
  const bralnik = document.getElementById('beri');
  let vklop = false;
  bralnik.appendChild(lupa);
  gumb.onclick = () => {
    vklop = !vklop;
    gumb.setAttribute('aria-pressed', vklop);
    bralnik.classList.toggle('z-lupo', vklop);
    if (!vklop) lupa.classList.remove('vidna');
  };
  oder.addEventListener('mousemove', e => {
    if (!vklop) return;
    const img = [...oder.querySelectorAll('.stran img.nalozena')].find(i => {
      const r = i.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && r.width > 50;
    });
    if (!img){ lupa.classList.remove('vidna'); return; }
    const r = img.getBoundingClientRect();
    const hd = HD + String(slike.indexOf(img)+1).padStart(3,'0') + '.webp';
    if (lupa.dataset.src !== hd){ lupa.style.backgroundImage = `url("${hd}")`; lupa.dataset.src = hd; }
    const L = lupa.offsetWidth || 260;
    lupa.style.backgroundSize = `${r.width*POVECAVA}px ${r.height*POVECAVA}px`;
    lupa.style.backgroundPosition = `${L/2-(e.clientX-r.left)*POVECAVA}px ${L/2-(e.clientY-r.top)*POVECAVA}px`;
    lupa.style.left = (e.clientX - L/2) + 'px';
    lupa.style.top = (e.clientY - L/2) + 'px';
    lupa.classList.add('vidna');
  });
  oder.addEventListener('mouseleave', () => lupa.classList.remove('vidna'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && vklop) gumb.click(); });
})();
})();
