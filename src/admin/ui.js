import { html, raw, toString } from '../lib/html.js';
import { adminT } from './i18n.js';

const FLASH_KIND = {
  saved: 'ok', published: 'ok', unpublished: 'ok', deleted: 'ok', created: 'ok', results: 'ok', password: 'ok',
  'need-both': 'warn', 'bad-login': 'err', locked: 'err', invalid: 'err',
};

export function flashFrom(L, url) {
  const key = url.searchParams.get('msg');
  return key && FLASH_KIND[key] ? [FLASH_KIND[key], L.flash[key]] : null;
}

function shell(L, title, body) {
  return toString(html`<!DOCTYPE html><html lang="${L.html}"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} — ${L.appTitle}</title>
<link rel="icon" href="/assets/img/logo-crest.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/admin/admin.css">
</head><body data-lang="${L.lang}">${body}<script src="/assets/admin/admin.js" defer></script></body></html>`);
}

export function adminPage({ user, active, title, body, flash, url }) {
  const L = adminT(user.lang);
  const f = flash || (url ? flashFrom(L, url) : null);
  const nav = [['home', '/admin', L.nav.home], ['news', '/admin/notizie', L.nav.news], ['matches', '/admin/partite', L.nav.matches],
    ['partners', '/admin/partner', L.nav.partners], ['users', '/admin/account', user.is_owner ? L.nav.account : L.nav.myAccount]];
  return shell(L, title, html`<header class="top"><div class="in">
  <a class="brand" href="/admin"><img src="/assets/img/logo-crest.png" alt=""><span>Sal Rei<small>${L.appName}</small></span></a>
  <nav class="nav">${nav.map(([k, href, label]) => html`<a href="${href}"${k === active ? raw(' class="on" aria-current="page"') : ''}>${label}</a>`)}</nav>
  <div class="who">
    <form method="post" action="/admin/lingua" class="langs-switch" aria-label="${L.panelLang}">
      <input type="hidden" name="back" value="${url ? url.pathname + url.search.replace(/[?&]msg=[^&]*/, '') : '/admin'}">
      <button type="submit" name="lang" value="it"${L.lang === 'it' ? raw(' class="on" aria-current="true"') : ''}>IT</button><button type="submit" name="lang" value="pt"${L.lang === 'pt' ? raw(' class="on" aria-current="true"') : ''}>PT</button>
    </form>
    ${user.name}<form method="post" action="/admin/esci"><button type="submit">${L.logout}</button></form></div>
</div></header>
<main>
${f ? html`<div class="flash ${f[0]}" role="status">${f[1]}</div>` : ''}
${body}
</main>`);
}

function langLinks(L, path) {
  return html`<p class="login-langs">${['it', 'pt'].map((l, i) => html`${i ? ' · ' : ''}<a href="${path}?lang=${l}"${l === L.lang ? raw(' aria-current="true"') : ''}>${adminT(l).langName}</a>`)}</p>`;
}

export function loginPage({ L, flash, email = '' }) {
  return shell(L, L.login.title, html`<div class="login">
  <div class="brand"><img src="/assets/img/logo-crest.png" alt="" style="height:44px"><span>Sport Sal Rei Club<small>${L.appName}</small></span></div>
  ${flash ? html`<div class="flash ${flash[0]}">${flash[1]}</div>` : ''}
  <form class="panel" method="post" action="/admin/accedi?lang=${L.lang}">
    <h1 style="margin-bottom:18px">${L.login.h1}</h1>
    <div class="field"><label for="email">${L.login.email}</label><input id="email" name="email" type="email" autocomplete="username" required value="${email}"></div>
    <div class="field"><label for="password">${L.login.password}</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
    <button class="btn primary" type="submit" style="width:100%">${L.login.submit}</button>
  </form>
  ${langLinks(L, '/admin/accedi')}
</div>`);
}

export function setupPage({ L, error }) {
  const s = L.setup;
  return shell(L, s.title, html`<div class="login">
  <div class="brand"><img src="/assets/img/logo-crest.png" alt="" style="height:44px"><span>Sport Sal Rei Club<small>${s.title}</small></span></div>
  ${error ? html`<div class="flash err">${error}</div>` : ''}
  <form class="panel" method="post" action="/admin/primo-accesso?lang=${L.lang}">
    <h1 style="margin-bottom:8px">${s.h1}</h1>
    <p class="muted" style="margin-bottom:18px">${s.intro}</p>
    <div class="field"><label for="key">${s.key}</label><input id="key" name="key" type="password" required></div>
    <div class="field"><label for="name">${s.name}</label><input id="name" name="name" type="text" required></div>
    <div class="field"><label for="email">${s.email}</label><input id="email" name="email" type="email" required></div>
    <div class="field"><label for="password">${s.password} <span class="hint">${s.min}</span></label><input id="password" name="password" type="password" minlength="10" required autocomplete="new-password"></div>
    <button class="btn primary" type="submit" style="width:100%">${s.submit}</button>
  </form>
  ${langLinks(L, '/admin/primo-accesso')}
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
