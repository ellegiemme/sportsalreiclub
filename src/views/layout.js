import { html, raw } from '../lib/html.js';
import { url, LANGS } from '../lib/i18n.js';

const NAV = [
  ['home', '/'], ['firstTeam', '/first-team'], ['season', '/season'], ['club', '/club'], ['news', '/news'],
];

function header(t, active, path) {
  const navLink = ([key, p]) => html`<a href="${url(t.lang, p)}"${active === key ? raw(' class="active" aria-current="page"') : ''}>${t.nav[key]}</a>`;
  const langLink = (l) => html`<a href="${url(l, path)}" hreflang="${l}" lang="${l}" data-lang="${l.toUpperCase()}"${l === t.lang ? raw(' class="active"') : ''}>${LANGS[l].langName}</a>`;
  return html`<header class="hd"><div class="wrap">
  <nav class="nav-left">
    ${NAV.map(navLink)}
  </nav>
  <a class="logo" href="${url(t.lang, '/')}" aria-label="Sport Sal Rei Club"><img src="/assets/img/logo-crest.png" alt=""></a>
  <div class="right">
    <nav class="nav-right">
      <a href="#">${t.nav.sponsor}</a><a href="#">${t.nav.media}</a><a href="#">${t.nav.shop}</a>
    </nav>
    <button class="menu-btn" type="button" aria-label="${t.nav.menu}" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
    <div class="lang" id="langSel">
      <button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <span class="cur">${t.lang.toUpperCase()}</span><i class="ti ti-chevron-down chev"></i>
      </button>
      <div class="lang-menu">
        ${langLink('en')}
        ${langLink('pt')}
      </div>
    </div>
  </div>
</div>
<nav class="mnav" id="mnav" aria-label="${t.nav.menu}"><div class="wrap"><div class="mnav-main">${NAV.map(navLink)}</div><div class="mnav-sub"><a href="#">${t.nav.sponsor}</a><a href="#">${t.nav.media}</a><a href="#">${t.nav.shop}</a></div></div></nav>
</header>`;
}

export function partnerLogo(p, cls) {
  if (p.logo) return html`<img class="wm-img${cls ? ' ' + cls : ''}" src="${p.logo}" alt="${p.name}">`;
  return raw(p.wordmark_html || html`<span class="wm">${p.name}</span>`.value);
}

function partnersStrip(t, partners) {
  const strip = partners.filter((p) => p.in_strip);
  if (!strip.length) return '';
  return html`<section class="partners"><div class="wrap">
  <div class="pt-head"><h2><span class="sec-eyebrow">${t.partners.eyebrow}</span>${t.partners.title}</h2>
  <a href="#">${t.partners.become} <i class="ti ti-arrow-right"></i></a></div>
  <div class="pt-row">
    ${strip.map((p) => html`<div class="pt-cell"><span class="pt-tier">${t.partners.tiers[p.tier] || t.partners.tiers.official}</span>${p.url ? html`<a href="${p.url}" target="_blank" rel="noopener">${partnerLogo(p, p.logo_class)}</a>` : partnerLogo(p, p.logo_class)}</div>`)}
  </div>
</div></section>`;
}

function footer(t) {
  const f = t.footer, u = (p) => url(t.lang, p);
  return html`<div class="forza"><h2>Juntos Somos Mais Fortes</h2></div>

<div class="social"><div class="wrap">
  <a href="#" aria-label="Facebook"><i class="ti ti-brand-facebook"></i></a>
  <a href="#" aria-label="Instagram"><i class="ti ti-brand-instagram"></i></a>
  <a href="#" aria-label="YouTube"><i class="ti ti-brand-youtube"></i></a>
  <a href="#" aria-label="TikTok"><i class="ti ti-brand-tiktok"></i></a>
  <a href="#" aria-label="X"><i class="ti ti-brand-x"></i></a>
</div></div>

<footer class="ft"><div class="wrap">
  <div class="ft-grid">
    <div class="ft-brand"><img src="/assets/img/logo-crest.png" alt="SSRC"><p>${f.brand}</p></div>
    <div><h4>${f.season}</h4><ul><li><a href="${u('/first-team')}">${f.team}</a></li><li><a href="${u('/season')}">${f.results}</a></li><li><a href="${u('/season')}#standings">${f.standings}</a></li><li><a href="${u('/season')}">${f.fixtures}</a></li></ul></div>
    <div><h4>${f.club}</h4><ul><li><a href="${u('/club')}">${f.history}</a></li><li><a href="${u('/club')}#honours">${f.honours}</a></li><li><a href="#">${f.stadium}</a></li><li><a href="#">${f.contact}</a></li></ul></div>
    <div><h4>${f.tickets}</h4><ul><li><a href="#">${f.buyTickets}</a></li><li><a href="#">${f.membership}</a></li><li><a href="#">${f.shop}</a></li><li><a href="#">${f.faq}</a></li></ul></div>
  </div>
  <div class="ft-bot"><span>&copy; 1951 — 2026 Sport Sal Rei Club</span><span>${f.place}</span></div>
</div></footer>`;
}

// css: stylesheet names in /assets/css, in cascade order (global.css is always last).
export function page({ t, title, css, active, path, body, partners = [], description }) {
  const full = title ? `${title} — ${t.siteName}` : t.homeTitle;
  const alt = t.lang === 'en' ? 'pt' : 'en';
  return html`<!DOCTYPE html><html lang="${t.locale}"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${full}</title>
${description ? html`<meta name="description" content="${description}">` : ''}
<link rel="alternate" hreflang="${alt}" href="${url(alt, path)}">
<link rel="icon" href="/assets/img/logo-crest.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.1.0/dist/tabler-icons.min.css">
${css.map((c) => html`<link rel="stylesheet" href="/assets/css/${c}.css">\n`)}<link rel="stylesheet" href="/assets/css/global.css">
</head>
<body>
${header(t, active, path)}
${body}
${partnersStrip(t, partners)}
${footer(t)}
<script src="/assets/js/site.js" defer></script>
</body></html>`;
}
