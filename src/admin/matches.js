import { html, raw } from '../lib/html.js';
import { computeTable } from '../lib/standings.js';
import { today } from '../lib/db.js';
import { adminPage, htmlResponse, redirect, itDate } from './ui.js';

async function load(db) {
  const { results: comps } = await db.prepare('SELECT * FROM competitions WHERE archived = 0 ORDER BY sort, id').all();
  const { results: teams } = await db.prepare('SELECT * FROM teams ORDER BY name').all();
  return { comps, teams, byId: new Map(teams.map((x) => [x.id, x])) };
}

function matchRow(m, byId) {
  const us = byId.get(m.home_id)?.is_us || byId.get(m.away_id)?.is_us;
  const done = m.status === 'played';
  return html`<div class="mrow${us ? ' us' : ''}${done ? ' done' : ''}">
  <span class="when">${itDate(m.date, true)}${m.time ? ` · ${m.time}` : ''}</span>
  <span class="teams-h">${byId.get(m.home_id)?.name}</span>
  <span class="sc"><input class="score" name="hs_${m.id}" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${m.home_score ?? ''}" aria-label="Gol ${byId.get(m.home_id)?.name}">
    <b>–</b><input class="score" name="as_${m.id}" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${m.away_score ?? ''}" aria-label="Gol ${byId.get(m.away_id)?.name}"></span>
  <span class="teams-a">${byId.get(m.away_id)?.name}</span>
  <details class="status"><summary>${m.status === 'postponed' ? 'Rinviata' : 'Modifica'}</summary>
    <div class="more">
      <div><label for="d_${m.id}">Data</label><input id="d_${m.id}" name="d_${m.id}" type="date" value="${m.date}"></div>
      <div><label for="t_${m.id}">Ora</label><input id="t_${m.id}" name="t_${m.id}" type="time" value="${m.time || ''}"></div>
      <div><label for="v_${m.id}">Campo</label><input id="v_${m.id}" name="v_${m.id}" type="text" value="${m.venue || ''}" placeholder="es. Estádio Arsénio Ramos"></div>
      <div><label for="s_${m.id}">Stato</label><select id="s_${m.id}" name="s_${m.id}">
        <option value="auto"${m.status !== 'postponed' ? raw(' selected') : ''}>Normale</option>
        <option value="postponed"${m.status === 'postponed' ? raw(' selected') : ''}>Rinviata</option></select></div>
      <div><label class="check"><input type="checkbox" name="del_${m.id}" value="1"> Elimina partita</label></div>
    </div>
  </details>
  <input type="hidden" name="ids" value="${m.id}">
</div>`;
}

export async function matchesPage({ db, user, url }) {
  const { comps, teams, byId } = await load(db);
  const now = today();
  const { results: all } = await db.prepare(`SELECT m.* FROM matches m JOIN competitions c ON c.id = m.competition_id WHERE c.archived = 0 ORDER BY m.date, m.id`).all();
  // Default tab: the competition with the oldest match still waiting for a result, else the next one.
  const waiting = all.find((m) => m.status === 'scheduled' && m.date < now) || all.find((m) => m.date >= now);
  const cid = url.searchParams.get('c') || waiting?.competition_id || comps[0]?.id;
  const comp = comps.find((c) => c.id === cid) || comps[0];
  const ms = all.filter((m) => m.competition_id === comp.id);
  const { results: ties } = await db.prepare('SELECT * FROM tie_order WHERE competition_id = ?').bind(comp.id).all();
  const tieOrder = Object.fromEntries(ties.map((x) => [x.team_id, x.priority]));

  const rounds = new Map();
  for (const m of ms) { const k = m.round ?? 0; if (!rounds.has(k)) rounds.set(k, []); rounds.get(k).push(m); }
  const missing = ms.filter((m) => m.status === 'scheduled' && m.date < now).length;
  const teamIds = [...new Set(ms.flatMap((m) => [m.home_id, m.away_id]))];
  const table = comp.kind === 'league' ? computeTable(teamIds, ms, tieOrder) : [];

  const body = html`<div class="head"><div><h1>Partite e risultati</h1>
  <p>Scrivi i gol e premi “Salva risultati”: la classifica sul sito si aggiorna da sola. Le partite del Sal Rei sono evidenziate.</p></div></div>
<nav class="tabs">${comps.map((c) => html`<a href="/admin/partite?c=${c.id}"${c.id === comp.id ? raw(' class="on"') : ''}>${c.name_pt}</a>`)}</nav>
${missing ? html`<div class="flash warn">${missing === 1 ? 'C’è 1 partita già giocata' : `Ci sono ${missing} partite già giocate`} senza risultato in questa competizione.</div>` : ''}
<form method="post" action="/admin/partite?c=${comp.id}">
  ${[...rounds].map(([r, list]) => html`<h2 class="round-h">${r ? `Giornata ${r}` : comp.name_pt}</h2>${list.map((m) => matchRow(m, byId))}`)}
  ${!ms.length ? html`<p class="muted">Nessuna partita in questa competizione.</p>` : ''}
  <div class="bar"><button class="btn primary" type="submit" name="action" value="save">Salva risultati</button>
    <span class="hint">Lascia vuoti i gol delle partite non ancora giocate.</span></div>
</form>

<div class="grid2 mt">
  ${comp.kind === 'league' ? html`<section class="panel"><h2>Classifica attuale</h2>
    <table><thead><tr><th>#</th><th>Squadra</th><th>G</th><th>DR</th><th>Pt</th></tr></thead>
    <tbody>${table.map((r) => html`<tr class="${byId.get(r.team)?.is_us ? 'us' : ''}"><td>${r.pos}</td><td>${byId.get(r.team)?.name}</td><td>${r.p}</td><td>${r.gd > 0 ? '+' + r.gd : r.gd}</td><td><b>${r.pts}</b></td></tr>`)}</tbody></table>
    <details class="mt"><summary class="hint" style="cursor:pointer">Spareggio manuale (sorteggio o spareggio)</summary>
      <form method="post" action="/admin/partite?c=${comp.id}" class="mt">
        <p class="hint" style="margin-bottom:10px">Serve solo se due squadre restano pari dopo tutti i criteri. Numero più basso = posizione più alta. Lascia vuoto per non usarlo.</p>
        ${teamIds.map((id) => html`<div class="facts-row"><span>${byId.get(id)?.name}</span><input type="number" min="1" max="20" name="tie_${id}" value="${tieOrder[id] ?? ''}" aria-label="Ordine manuale ${byId.get(id)?.name}"></div>`)}
        <button class="btn small" type="submit" name="action" value="ties">Salva ordine</button>
      </form>
    </details>
  </section>` : ''}
  <section class="panel"><h2>Aggiungi una partita</h2>
    <form method="post" action="/admin/partite?c=${comp.id}">
      <div class="field"><label for="n_date">Data</label><input id="n_date" name="n_date" type="date" required></div>
      <div class="grid2">
        <div class="field"><label for="n_home">In casa</label><select id="n_home" name="n_home">${teams.map((x) => html`<option value="${x.id}">${x.name}</option>`)}</select></div>
        <div class="field"><label for="n_away">In trasferta</label><select id="n_away" name="n_away">${teams.map((x) => html`<option value="${x.id}">${x.name}</option>`)}</select></div>
      </div>
      <div class="grid2">
        <div class="field"><label for="n_round">Giornata <span class="hint">(facoltativa)</span></label><input id="n_round" name="n_round" type="number" min="1" max="60"></div>
        <div class="field"><label for="n_time">Ora <span class="hint">(facoltativa)</span></label><input id="n_time" name="n_time" type="time"></div>
      </div>
      <button class="btn" type="submit" name="action" value="add">Aggiungi a ${comp.name_pt}</button>
    </form>
  </section>
</div>`;
  return htmlResponse(adminPage({ user, active: 'matches', title: 'Partite', body, url }));
}

const score = (v) => { const s = String(v ?? '').trim(); return /^\d{1,2}$/.test(s) ? Number(s) : null; };

export async function saveMatches({ db, url, form }) {
  const c = url.searchParams.get('c') || '';
  const back = (msg) => redirect(`/admin/partite?c=${encodeURIComponent(c)}&msg=${msg}`);
  const action = form.get('action');

  if (action === 'add') {
    const date = String(form.get('n_date') || ''), home = form.get('n_home'), away = form.get('n_away');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !home || !away || home === away) return back('invalid');
    const round = Number(form.get('n_round')) || null;
    const time = /^\d{2}:\d{2}$/.test(form.get('n_time') || '') ? form.get('n_time') : null;
    await db.prepare('INSERT INTO matches (competition_id, round, date, time, home_id, away_id) VALUES (?, ?, ?, ?, ?, ?)').bind(c, round, date, time, home, away).run();
    return back('created');
  }

  if (action === 'ties') {
    const stmts = [db.prepare('DELETE FROM tie_order WHERE competition_id = ?').bind(c)];
    for (const [k, v] of form.entries()) {
      if (k.startsWith('tie_') && String(v).trim()) stmts.push(db.prepare('INSERT INTO tie_order (competition_id, team_id, priority) VALUES (?, ?, ?)').bind(c, k.slice(4), Number(v)));
    }
    await db.batch(stmts);
    return back('saved');
  }

  const stmts = [];
  for (const id of form.getAll('ids').map(Number).filter(Boolean)) {
    if (form.get(`del_${id}`)) { stmts.push(db.prepare('DELETE FROM matches WHERE id = ?').bind(id)); continue; }
    const hs = score(form.get(`hs_${id}`)), as = score(form.get(`as_${id}`));
    const postponed = form.get(`s_${id}`) === 'postponed';
    const status = postponed ? 'postponed' : hs !== null && as !== null ? 'played' : 'scheduled';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(form.get(`d_${id}`) || '') ? form.get(`d_${id}`) : null;
    const time = /^\d{2}:\d{2}$/.test(form.get(`t_${id}`) || '') ? form.get(`t_${id}`) : null;
    const venue = String(form.get(`v_${id}`) || '').trim().slice(0, 80) || null;
    stmts.push(db.prepare(`UPDATE matches SET home_score = ?, away_score = ?, status = ?, date = COALESCE(?, date), time = ?, venue = ? WHERE id = ?`)
      .bind(status === 'played' ? hs : null, status === 'played' ? as : null, status, date, time, venue, id));
  }
  if (stmts.length) await db.batch(stmts);
  return back('results');
}
