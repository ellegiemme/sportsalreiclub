import { html } from '../lib/html.js';
import { url } from '../lib/i18n.js';
import { page, partnerLogo } from './layout.js';
import { sponsorInline } from './parts.js';
import { players, staff } from '../data/squad.js';

export function teamPage({ t, partners, placements }) {
  const s = t.team;
  const card = (p) => html`<div class="pc">
      <div class="num">${p.num}</div>
      <div class="shot">${p.photo ? html`<img src="${p.photo}" alt="${p.name}">` : html`<div class="silo"><i class="ti ti-user"></i></div>`}</div>
      <div class="veil"></div>
      <div class="plate">
        <span class="pos-tag">${s.positions[p.pos]}</span>
        <div class="nm">${p.name}</div>
      </div>
    </div>`;
  const groups = ['gk', 'df', 'mf', 'fw'].map((g) => html`<div class="squad-h">${s.groups[g]}</div>
  <div class="squad">
    ${players.filter((p) => p.group === g).map(card)}
  </div>`);
  const kit = placements.kit;
  const body = html`
<section class="phero"><div class="ph-img"><img src="/assets/img/hero-stadium.jpg" alt="${s.heroAlt}" style="object-position:center 40%"></div><div class="wrap"><div class="inner">
  <span class="kicker">${s.kicker}</span>
  <h1>${s.h1A}<br><span>${s.h1B}</span></h1>
  <p class="sub">${s.sub}</p>
</div></div></section>

<section class="section seam-prev"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${s.playersEyebrow}</span>${s.playersTitle}</h2>${sponsorInline(t.partners.squad, placements.squad)}</div>
  ${groups}
</div></section>

<section class="section seam-sec"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${s.staffEyebrow}</span>${s.staffTitle}</h2></div>
  <div class="staff">
    ${staff.map((m) => html`<div class="st"><div class="rl">${s.roles[m.role]}</div><div class="nm">${m.name}</div></div>`)}
  </div>
</div></section>

<div class="cta-band"><div class="wrap">
  <h2>${s.follow}</h2>
  <a href="${url(t.lang, '/season')}">${s.followLink} <i class="ti ti-arrow-right"></i></a>
</div></div>
${kit ? html`
<div class="sp-slim"><div class="wrap"><span class="sp-eyebrow">${t.partners.kit}</span>${partnerLogo(kit, 'md')}<a class="more" href="#">${t.partners.kitLink} <i class="ti ti-arrow-right"></i></a></div></div>` : ''}
`;
  return page({ t, title: s.title, css: ['first-team', 'sponsor'], active: 'firstTeam', path: '/first-team', body, partners, description: s.sub });
}
