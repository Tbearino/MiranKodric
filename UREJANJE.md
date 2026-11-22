# Urejanje strani

## Kje je kaj

| Mapa / datoteka | Kaj vsebuje |
|---|---|
| `index.html`, `literatura.html`, `znanost.html` … | Strani. Vsebina pride iz mape `vsebina/`. |
| `knjiga.html`, `js/knjiga.js`, `knjiga/` | Bralnik knjige o Janezu Nemcu. |
| `vsebina/*.json` | Vsa besedila in seznami. To ureja urejevalnik. |
| `slike/vsebina/` | Slike, naložene prek urejevalnika (samodejno stisnjene v webp). |
| `js/skupno.js` | Meni, noga, prehodi. Meni spreminjaš v seznamu `PREDALI`. |
| `js/vsebina.js` | Kako se vsebina iz `vsebina/` izriše na strani. |
| `admin/` | Urejevalnik (Sveltia CMS 0.261.0). Nastavitve v `admin/config.yml`. |
| `api/auth.js`, `api/callback.js` | Varna prijava v urejevalnik prek GitHuba. |
| `api/ogledi.js` | Števec ogledov knjige. |
| `vercel.json` | Varnostne glave strani. |

## Spremenljivke v Vercelu (Settings → Environment Variables)

| Ime | Vrednost |
|---|---|
| `GITHUB_CLIENT_ID` | iz GitHub OAuth aplikacije |
| `GITHUB_CLIENT_SECRET` | iz GitHub OAuth aplikacije (nikoli v kodo!) |
| `SITE_ORIGINS` | `https://miran-kodric.vercel.app` (ob lastni domeni dodaj še njo, z vejico) |
| `ALLOWED_GITHUB_USERS` | GitHub uporabniška imena z dostopom, npr. `Tbearino,mirankondric` |

## Nova lastna domena

1. Domeno dodaj v Vercelu.
2. V `admin/config.yml` zamenjaj `base_url`, `site_url` in `display_url`.
3. V GitHub OAuth aplikaciji popravi Homepage in Callback URL (`https://domena/api/callback`).
4. V Vercelu posodobi `SITE_ORIGINS` (nova domena naj bo prva).

## Varnost na kratko

- Glavna koda urejevalnika in knjižnice so gostovane na strani, ne na tujih strežnikih.
- Stran ne izvaja nobene vrinjene kode (`Content-Security-Policy` brez `unsafe-inline` za skripte).
- Vsebina iz urejevalnika se prikaže kot besedilo; markdown gre skozi DOMPurify.
- Povezave `javascript:` in slike s tujih strani se ne prikažejo.
- Prijava: CSRF zaščita, žeton gre samo oknu urejevalnika, dostop samo dovoljenim uporabnikom.
- Oba GitHub računa naj imata vklopljeno dvostopenjsko preverjanje (2FA).
