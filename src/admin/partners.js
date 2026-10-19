import { html, raw } from '../lib/html.js';
import { adminPage, htmlResponse, redirect } from './ui.js';
import { adminT } from './i18n.js';

const TIERS = ['main', 'technical', 'official'];
export const SLOTS = ['main_band', 'matchday', 'academy', 'newsroom', 'match_centre', 'standings', 'squad', 'kit'];
// Sponsor spaces grouped by the page they appear on.
const PAGES = [['home', ['main_band', 'matchday', 'academy']], ['news', ['newsroom']], ['season', ['match_centre', 'standings']], ['team', ['squad', 'kit']]];

function logo(p) {
  if (p.logo) return html`<span class="plogo"><img src="${p.logo}" alt=""></span>`;
  return html`<span class="plogo">${p.name}</span>`;
}

export async function partnersPage({ db, user, url }) {
  const P = adminT(user.lang).partners;
  const { results: partners } = await db.prepare('SELECT * FROM partners ORDER BY active DESC, sort, id').all();
  const { results: slots } = await db.prepare('SELECT * FROM placements').all();
  const slotOf = Object.fromEntries(slots.map((s) => [s.slot, s.partner_id]));
  const body = html`<div class="head"><div><h1>${P.title}</h1><p>${P.intro}</p></div>
  <a class="btn primary" href="/admin/partner/nuovo">${P.add}</a></div>
<div class="list">
${partners.map((p) => { const here = SLOTS.filter((x) => slotOf[x] === p.id).map((x) => P.slots[x][0]); return html`<a class="row" href="/admin/partner/${p.id}">${logo(p)}
  <span class="grow"><span class="t">${p.name}</span><span class="s">${P.tiers[p.tier]}${p.in_strip ? ` · ${P.inStrip}` : ''}${here.length ? ` · ${here.join(', ')}` : ''}</span></span>
  <span class="pill ${p.active ? 'pub' : ''}">${p.active ? P.active : P.hidden}</span></a>`; })}
</div>

<form class="panel mt" method="post" action="/admin/partner/posizioni">
  <h2>${P.slotsTitle}</h2>
  <p class="muted" style="margin-bottom:16px">${P.slotsIntro}</p>
  <div class="grid2">
  ${SLOTS.map((slot) => { const [label, where] = P.slots[slot]; return html`<div class="field"><label for="slot_${slot}">${label} <span class="hint">— ${where}</span></label>
    <select id="slot_${slot}" name="slot_${slot}"><option value="">${P.none}</option>${partners.filter((p) => p.active).map((p) => html`<option value="${p.id}"${slotOf[slot] === p.id ? raw(' selected') : ''}>${p.name}</option>`)}</select></div>`; })}
  </div>
  <button class="btn dark" type="submit">${P.saveSlots}</button>
</form>`;
  return htmlResponse(adminPage({ user, active: 'partners', title: P.title, body, url }));
}

export async function editPartner({ db, user, url, id }) {
  const P = adminT(user.lang).partners;
  const p = id ? await db.prepare('SELECT * FROM partners WHERE id = ?').bind(id).first()
    : { name: '', tier: 'official', logo: '', url: '', sort: 99, in_strip: 1, active: 1 };
  if (!p) return redirect('/admin/partner');
  const { results: taken } = await db.prepare('SELECT pl.slot, pa.id, pa.name FROM placements pl JOIN partners pa ON pa.id = pl.partner_id').all();
  const holder = Object.fromEntries(taken.map((x) => [x.slot, x]));
  const slotBox = (slot) => {
    const h = holder[slot], mine = id && h?.id === id;
    return html`<label class="slot${mine ? ' on' : ''}"><input type="checkbox" name="slot" value="${slot}"${mine ? raw(' checked') : ''}>
      <span><b>${P.slots[slot][0]}</b><small>${P.slots[slot][1]}</small>
      <small class="${h && !mine ? 'taken' : ''}">${mine ? '' : h ? html`${P.now} ${h.name}<span class="repl"> — ${P.willReplace}</span>` : P.free}</small></span></label>`;
  };
  const body = html`<a class="crumb" href="/admin/partner">${P.all}</a>
<div class="head"><h1>${id ? p.name : P.newTitle}</h1></div>
<form class="panel" method="post" action="/admin/partner/${id || 'nuovo'}">
  <div class="grid2">
    <div class="field"><label for="name">${P.name}</label><input id="name" name="name" type="text" required value="${p.name}"></div>
    <div class="field"><label for="tier">${P.tier}</label><select id="tier" name="tier">${TIERS.map((v) => html`<option value="${v}"${v === p.tier ? raw(' selected') : ''}>${P.tiers[v]}</option>`)}</select></div>
    <div class="field"><label for="url">${P.url} <span class="hint">${P.urlHint}</span></label><input id="url" name="url" type="url" value="${p.url || ''}" placeholder="https://"></div>
    <div class="field"><label for="sort">${P.sort} <span class="hint">${P.sortHint}</span></label><input id="sort" name="sort" type="number" min="1" max="99" value="${p.sort}"></div>
  </div>
  <label>${P.logo}</label>
  <div class="imgbox">
    <div class="preview" id="img-preview" style="background-color:#1d1416;background-size:contain;background-origin:content-box;padding:16px;${p.logo ? `background-image:url('${p.logo}')` : ''}">${p.logo ? '' : html`<span style="color:#fff;font-weight:800">${p.name || P.noLogo}</span>`}</div>
    <div>
      <input type="hidden" name="logo" id="image" value="${p.logo || ''}">
      <label class="btn" for="img-file" style="margin:0">${P.uploadLogo}</label>
      <input class="sr" type="file" id="img-file" accept="image/png,image/svg+xml,image/webp,image/jpeg" data-kind="logo">
      <p class="hint mt" id="img-status">${P.logoHint}</p>
    </div>
  </div>
  <h2 class="mt" style="margin-top:28px">${P.whereTitle}</h2>
  <p class="muted" style="margin-bottom:14px">${P.whereIntro}</p>
  <div class="slots">${PAGES.map(([pg, slots]) => html`<div class="slot-page"><h3>${P.pages[pg]}</h3>${slots.map(slotBox)}</div>`)}</div>
  <div class="actions mt">
    <label class="check"><input type="checkbox" name="in_strip" value="1"${p.in_strip ? raw(' checked') : ''}> ${P.showStrip}</label>
    <label class="check"><input type="checkbox" name="active" value="1"${p.active ? raw(' checked') : ''}> ${P.activeLabel}</label>
  </div>
  <div class="bar"><button class="btn primary" type="submit" name="action" value="save">${P.save}</button>
  ${id ? html`<span class="spacer"></span><button class="btn danger" type="submit" name="action" value="delete" data-confirm="${P.confirmDelete}">${P.delete}</button>` : ''}</div>
</form>`;
  return htmlResponse(adminPage({ user, active: 'partners', title: p.name || P.newTitle, body, url }));
}

export async function savePartner({ db, id, form }) {
  if (form.get('action') === 'delete' && id) {
    await db.batch([db.prepare('UPDATE placements SET partner_id = NULL WHERE partner_id = ?').bind(id), db.prepare('DELETE FROM partners WHERE id = ?').bind(id)]);
    return redirect('/admin/partner?msg=deleted');
  }
  const name = String(form.get('name') || '').trim().slice(0, 80);
  if (!name) return redirect(`/admin/partner/${id || 'nuovo'}?msg=invalid`);
  const tier = TIERS.includes(form.get('tier')) ? form.get('tier') : 'official';
  const link = /^https?:\/\//.test(form.get('url') || '') ? String(form.get('url')).slice(0, 300) : null;
  const logo = /^\/(media|assets)\//.test(form.get('logo') || '') ? form.get('logo') : null;
  const sort = Math.min(99, Math.max(1, Number(form.get('sort')) || 99));
  const inStrip = form.get('in_strip') ? 1 : 0, active = form.get('active') ? 1 : 0;
  if (id) {
    const old = await db.prepare('SELECT logo, logo_class FROM partners WHERE id = ?').bind(id).first();
    const cls = logo && logo !== old?.logo ? 'sm' : old?.logo_class;
    await db.prepare('UPDATE partners SET name = ?, tier = ?, url = ?, logo = ?, logo_class = ?, sort = ?, in_strip = ?, active = ? WHERE id = ?')
      .bind(name, tier, link, logo, cls, sort, inStrip, active, id).run();
    await applySlots(db, id, form, active);
    return redirect(`/admin/partner/${id}?msg=saved`);
  }
  const r = await db.prepare('INSERT INTO partners (name, tier, url, logo, logo_class, sort, in_strip, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(name, tier, link, logo, 'sm', sort, inStrip, active).first();
  await applySlots(db, r.id, form, active);
  return redirect(`/admin/partner/${r.id}?msg=created`);
}

// Ticked spaces go to this partner (replacing whoever had them); unticked ones it held are freed.
async function applySlots(db, pid, form, active) {
  const chosen = active ? new Set(form.getAll('slot').filter((x) => SLOTS.includes(x))) : new Set();
  await db.batch(SLOTS.map((slot) => chosen.has(slot)
    ? db.prepare('INSERT INTO placements (slot, partner_id) VALUES (?, ?) ON CONFLICT(slot) DO UPDATE SET partner_id = excluded.partner_id').bind(slot, pid)
    : db.prepare('UPDATE placements SET partner_id = NULL WHERE slot = ? AND partner_id = ?').bind(slot, pid)));
}

export async function savePlacements({ db, form }) {
  const stmts = SLOTS.map((slot) => {
    const pid = Number(form.get(`slot_${slot}`)) || null;
    return db.prepare('INSERT INTO placements (slot, partner_id) VALUES (?, ?) ON CONFLICT(slot) DO UPDATE SET partner_id = excluded.partner_id').bind(slot, pid);
  });
  await db.batch(stmts);
  return redirect('/admin/partner?msg=saved');
}
