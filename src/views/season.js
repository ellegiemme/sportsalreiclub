import { html } from '../lib/html.js';
import { monthYear, parseDate } from '../lib/i18n.js';
import { computeTable } from '../lib/standings.js';
import { today } from '../lib/db.js';
import { page } from './layout.js';
import { teamName, teamShort, roundLabel, resultLetter, sponsorInline, dayMonth } from './parts.js';

function fixtureRow(t, teams, comp, m, nextId) {
  const res = resultLetter(teams, m);
  const label = { w: t.match.win, d: t.match.draw, l: t.match.loss };
  const { d } = parseDate(m.date);
  return html`<div class="fx${res ? ' res-' + res : ''}${m.id === nextId ? ' hl' : ''}">
      <div class="d">${String(d).padStart(2, '0')}<small>${t.monthsShort[parseDate(m.date).m - 1]}</small></div>
      <div class="c">${roundLabel(t, m) || (t.lang === 'pt' ? comp.name_pt : comp.name_en)}</div>
      <div class="t"><span>${teamName(teams, m.home_id)}</span>${m.status === 'played'
        ? html`<span class="sc">${m.home_score} - ${m.away_score}</span>`
        : html`<span class="vs">${t.match.vs}</span>`}<span>${teamName(teams, m.away_id)}</span></div>
      <div class="v">${m.venue ? html`<span><i class="ti ti-map-pin"></i>${m.venue}</span>` : ''}${res
        ? html`<span class="rb ${res}">${label[res]}</span>`
        : html`<span><i class="ti ti-clock"></i>${m.time || t.match.timeTbc}</span>`}</div>
    </div>`;
}

function fixtureList(t, teams, comp, matches, nextId) {
  const out = [];
  let month = '';
  for (const m of matches) {
    const mm = m.date.slice(0, 7);
    if (mm !== month) { month = mm; out.push(html`<div class="fx-month">${monthYear(t, m.date)}</div>`); }
    out.push(fixtureRow(t, teams, comp, m, nextId));
  }
  return html`<div class="fx-list">${out}</div>`;
}

function table(t, teams, rows) {
  const s = t.season.table;
  return html`<div class="tbl-wrap"><table class="standings">
    <thead><tr><th>${s.pos}</th><th class="tm">${s.team}</th><th>${s.p}</th><th>${s.w}</th><th>${s.d}</th><th>${s.l}</th><th>${s.gf}</th><th>${s.ga}</th><th>${s.gd}</th><th>${s.pts}</th></tr></thead>
    <tbody>${rows.map((r) => html`<tr class="${teams.get(r.team)?.is_us ? 'me' : ''}"><td class="pos">${r.pos}</td><td class="tm"><span class="crest">${teamShort(teams, r.team)}</span>${teamName(teams, r.team)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd > 0 ? '+' + r.gd : r.gd < 0 ? '−' + -r.gd : '0'}</td><td class="pts">${r.pts}</td></tr>`)}</tbody>
  </table></div>`;
}

function allRounds(t, teams, comp) {
  const rounds = new Map();
  for (const m of comp.matches) {
    if (!rounds.has(m.round)) rounds.set(m.round, []);
    rounds.get(m.round).push(m);
  }
  return html`<details class="rounds"><summary>${t.season.allMatches}</summary><div class="rounds-grid">
    ${[...rounds].map(([r, ms]) => html`<div class="round"><h4>${t.match.matchday} ${r} · ${dayMonth(t, ms[0].date)}</h4>
      ${ms.map((m) => html`<div class="rm${teams.get(m.home_id)?.is_us || teams.get(m.away_id)?.is_us ? ' us' : ''}"><span>${teamName(teams, m.home_id)}</span><b>${m.status === 'played' ? `${m.home_score}-${m.away_score}` : t.match.vs}</b><span>${teamName(teams, m.away_id)}</span></div>`)}
    </div>`)}
  </div></details>`;
}

export function seasonPage({ t, teams, comps, partners, placements }) {
  const s = t.season;
  const ourId = [...teams.values()].find((x) => x.is_us)?.id;
  const now = today();
  const next = comps.flatMap((c) => c.matches)
    .filter((m) => m.status === 'scheduled' && m.date >= now && (m.home_id === ourId || m.away_id === ourId))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  // Open the tab of the competition being played now (or next).
  const current = next?.competition_id || comps[comps.length - 1]?.id;

  const panel = (c) => {
    const name = t.lang === 'pt' ? c.name_pt : c.name_en;
    const ours = c.matches.filter((m) => m.home_id === ourId || m.away_id === ourId);
    const teamIds = [...new Set(c.matches.flatMap((m) => [m.home_id, m.away_id]))];
    const played = c.matches.some((m) => m.status === 'played');
    return html`<div class="comp-panel" id="${c.id}" data-tab-panel${c.id === current ? '' : ' data-inactive'}>
    <div class="sec-h"><h2><span class="sec-eyebrow">${s.calendar} ${c.season}</span>${name}</h2>${sponsorInline(t.partners.matchCentre, placements.match_centre)}</div>
    ${fixtureList(t, teams, c, ours, next?.id)}
    ${c.kind === 'league' ? html`
    <div class="comp-table" id="standings-${c.id}">
      <div class="sec-h"><h2><span class="sec-eyebrow">${name}</span>${s.standingsOf}</h2>${sponsorInline(t.partners.standings, placements.standings)}</div>
      ${table(t, teams, computeTable(teamIds, c.matches, c.tieOrder))}
      <div class="leg"><span><i></i>${teamName(teams, ourId)}</span>${played ? '' : html`<span>${s.noResults}</span>`}</div>
      <p class="tiebreak">${s.tiebreak}</p>
      ${allRounds(t, teams, c)}
    </div>` : ''}
  </div>`;
  };

  const body = html`
<section class="phero"><div class="ph-img"><img src="/assets/img/matchday-arsenio-ramos.jpg" alt="${t.lang === 'pt' ? 'Dia de jogo no Estádio Arsénio Ramos' : 'Match day at Estádio Arsénio Ramos'}" style="object-position:center 55%"></div><div class="wrap"><div class="inner">
  <span class="kicker">${s.kicker}</span>
  <h1>${s.h1A}<br><span>${s.h1B}</span></h1>
  <p class="sub">${s.sub}</p>
</div></div></section>

<section class="section seam-prev" id="standings"><div class="wrap">
  <div class="mtabs" role="tablist">
    ${comps.map((c) => html`<a class="mtab${c.id === current ? ' on' : ''}" href="#${c.id}" role="tab" data-tab="${c.id}">${t.lang === 'pt' ? c.name_pt : c.name_en}</a>`)}
  </div>
  ${comps.map(panel)}
</div></section>
`;
  return page({ t, title: s.title, css: ['season', 'sponsor'], active: 'season', path: '/season', body, partners, description: s.sub });
}
