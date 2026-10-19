// Small pieces shared by several pages.
import { html } from '../lib/html.js';
import { url, pick, longDate, shortDate, dayMonth } from '../lib/i18n.js';
import { partnerLogo } from './layout.js';

export const newsUrl = (t, n) => url(t.lang, `/news/${n.slug}`);
export const category = (t, n) => t.news.categories[n.category] || n.category;

// Picture of a news item: its photo, or the big-figure graphic when there is none.
export function newsVisual(t, n, imgClass = '') {
  if (n.image) {
    return html`<img${imgClass ? html` class="${imgClass}"` : ''} src="${n.image}" alt=""${n.image_pos ? html` style="object-position:${n.image_pos}"` : ''}>`;
  }
  return html`<div class="gfx"><div class="big">${n.gfx_big || '·'}</div><div class="cap">${pick(n, 'gfx_cap', t.lang)}</div></div>`;
}

export function acard(t, n, { readTime = true } = {}) {
  return html`<a class="acard" href="${newsUrl(t, n)}">
      <div class="ph">${newsVisual(t, n)}</div>
      <div class="body"><span class="tag">${category(t, n)}</span><h3>${pick(n, 'title', t.lang)}</h3>
      <div class="meta">${longDate(t, n.date)}${readTime ? html`<span class="dot"></span>${n.read_min} ${t.news.minRead}` : ''}</div></div></a>`;
}

export function newsroomPartner(t, placements) {
  const p = placements.newsroom;
  if (!p) return '';
  return html`<div class="sp-slim"><div class="wrap"><span class="sp-eyebrow">${t.partners.newsroom}</span>${partnerLogo(p, 'md')}<a class="more" href="#">${t.partners.become} <i class="ti ti-arrow-right"></i></a></div></div>`;
}

export function sponsorInline(label, p, style = '') {
  if (!p) return '';
  return html`<div class="sp-inline"${style ? html` style="${style}"` : ''}><span class="pby">${label}</span>${partnerLogo(p, 'md')}</div>`;
}

// Match helpers
export function teamName(teams, id) { return teams.get(id)?.name || id; }
export function teamShort(teams, id) { return teams.get(id)?.short || id.slice(0, 3).toUpperCase(); }
export function compName(t, m) { return t.lang === 'pt' ? m.comp_pt : m.comp_en; }
export function roundLabel(t, m) { return m.round ? `${t.match.matchday} ${m.round}` : ''; }
export function weAreHome(teams, m) { return !!teams.get(m.home_id)?.is_us; }
export function resultLetter(teams, m) {
  if (m.status !== 'played') return null;
  const us = weAreHome(teams, m) ? m.home_score : m.away_score;
  const them = weAreHome(teams, m) ? m.away_score : m.home_score;
  return us > them ? 'w' : us < them ? 'l' : 'd';
}
export { shortDate, dayMonth };
