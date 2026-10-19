import { html, raw, toString } from '../lib/html.js';

const NAV = [['home', '/admin', 'Inizio'], ['news', '/admin/notizie', 'Notizie'], ['matches', '/admin/partite', 'Partite'], ['partners', '/admin/partner', 'Partner']];

const FLASH = {
  saved: ['ok', 'Modifiche salvate.'],
  published: ['ok', 'Pubblicato: ora è visibile sul sito.'],
  unpublished: ['ok', 'Ritirato dal sito: ora è una bozza.'],
  deleted: ['ok', 'Eliminato.'],
  created: ['ok', 'Creato.'],
  results: ['ok', 'Risultati salvati. La classifica è già aggiornata sul sito.'],
  password: ['ok', 'Password cambiata.'],
  'need-both': ['warn', 'Per pubblicare servono titolo e testo in tutte e due le lingue. Usa “Traduci” per completare l’altra lingua.'],
  'bad-login': ['err', 'Email o password non corretti.'],
  locked: ['err', 'Troppi tentativi. Riprova tra un quarto d’ora.'],
  invalid: ['err', 'Controlla i campi evidenziati.'],
  'upload-failed': ['err', 'Caricamento dell’immagine non riuscito. Usa una foto JPG o PNG sotto i 10 MB.'],
};

export function flashFrom(url) {
  const key = url.searchParams.get('msg');
  return key && FLASH[key] ? FLASH[key] : null;
}

function shell(title, body, extraHead = '') {
  return toString(html`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} — Gestione sito Sal Rei</title>
<link rel="icon" href="/assets/img/logo-crest.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/admin/admin.css">
${extraHead}
</head><body>${body}<script src="/assets/admin/admin.js" defer></script></body></html>`);
}

export function adminPage({ user, active, title, body, flash, url }) {
  const f = flash || (url ? flashFrom(url) : null);
  const nav = user.is_owner ? [...NAV, ['users', '/admin/account', 'Account']] : [...NAV, ['users', '/admin/account', 'Il mio account']];
  return shell(title, html`<header class="top"><div class="in">
  <a class="brand" href="/admin"><img src="/assets/img/logo-crest.png" alt=""><span>Sal Rei<small>Gestione sito</small></span></a>
  <nav class="nav">${nav.map(([k, href, label]) => html`<a href="${href}"${k === active ? raw(' class="on" aria-current="page"') : ''}>${label}</a>`)}</nav>
  <div class="who">${user.name}<form method="post" action="/admin/esci"><button type="submit">Esci</button></form></div>
</div></header>
<main>
${f ? html`<div class="flash ${f[0]}" role="status">${f[1]}</div>` : ''}
${body}
</main>`);
}

export function loginPage({ flash, email = '' }) {
  return shell('Accesso', html`<div class="login">
  <div class="brand"><img src="/assets/img/logo-crest.png" alt="" style="height:44px"><span>Sport Sal Rei Club<small>Gestione sito</small></span></div>
  ${flash ? html`<div class="flash ${flash[0]}">${flash[1]}</div>` : ''}
  <form class="panel" method="post" action="/admin/accedi">
    <h1 style="margin-bottom:18px">Accedi</h1>
    <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" required value="${email}"></div>
    <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
    <button class="btn primary" type="submit" style="width:100%">Entra</button>
  </form>
</div>`);
}

export function setupPage({ error }) {
  return shell('Primo accesso', html`<div class="login">
  <div class="brand"><img src="/assets/img/logo-crest.png" alt="" style="height:44px"><span>Sport Sal Rei Club<small>Primo accesso</small></span></div>
  ${error ? html`<div class="flash err">${error}</div>` : ''}
  <form class="panel" method="post" action="/admin/primo-accesso">
    <h1 style="margin-bottom:8px">Crea il primo account</h1>
    <p class="muted" style="margin-bottom:18px">Serve la chiave di attivazione impostata su Cloudflare (SETUP_KEY). Questo account potrà poi creare gli altri.</p>
    <div class="field"><label for="key">Chiave di attivazione</label><input id="key" name="key" type="password" required></div>
    <div class="field"><label for="name">Il tuo nome</label><input id="name" name="name" type="text" required></div>
    <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required></div>
    <div class="field"><label for="password">Password <span class="hint">(almeno 10 caratteri)</span></label><input id="password" name="password" type="password" minlength="10" required autocomplete="new-password"></div>
    <button class="btn primary" type="submit" style="width:100%">Crea account</button>
  </form>
</div>`);
}

export function htmlResponse(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'same-origin',
      ...headers,
    },
  });
}

export function redirect(location, headers = {}) {
  return new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store', ...headers } });
}

// Dates in the admin are written in Italian.
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
export function itDate(iso, withDay = false) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${withDay ? GIORNI[dow] + ' ' : ''}${d} ${MESI[m - 1]} ${y}`;
}
