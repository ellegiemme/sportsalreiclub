import { html, raw } from '../lib/html.js';
import { adminPage, htmlResponse, redirect } from './ui.js';

const TIERS = [['main', 'Partner principale'], ['technical', 'Partner tecnico'], ['official', 'Partner ufficiale']];
export const SLOTS = [
  ['main_band', 'Partner principale', 'grande banda nera in home'],
  ['matchday', 'Partner del giorno partita', 'fascia rossa dei risultati in home'],
  ['academy', 'Partner dell’accademia', 'sezione Accademia in home'],
  ['newsroom', 'Partner delle notizie', 'pagine Notizie e articoli'],
  ['match_centre', 'Partner del calendario', 'pagina Stagione'],
  ['standings', 'Partner della classifica', 'pagina Stagione'],
  ['squad', 'Presenta la rosa', 'pagina Prima squadra'],
  ['kit', 'Sponsor tecnico (maglie)', 'pagina Prima squadra'],
];

function logo(p) {
  if (p.logo) return html`<span class="plogo"><img src="${p.logo}" alt=""></span>`;
  return html`<span class="plogo">${p.name}</span>`;
}

export async function partnersPage({ db, user, url }) {
  const { results: partners } = await db.prepare('SELECT * FROM partners ORDER BY active DESC, sort, id').all();
  const { results: slots } = await db.prepare('SELECT * FROM placements').all();
  const slotOf = Object.fromEntries(slots.map((s) => [s.slot, s.partner_id]));
  const body = html`<div class="head"><div><h1>Partner</h1><p>I partner attivi con “Mostra nella fascia” compaiono in fondo a tutte le pagine, in quest’ordine.</p></div>
  <a class="btn primary" href="/admin/partner/nuovo">+ Nuovo partner</a></div>
<div class="list">
${partners.map((p) => html`<a class="row" href="/admin/partner/${p.id}">${logo(p)}
  <span class="grow"><span class="t">${p.name}</span><span class="s">${TIERS.find((x) => x[0] === p.tier)?.[1]}${p.in_strip ? ' · nella fascia partner' : ''}</span></span>
  <span class="pill ${p.active ? 'pub' : ''}">${p.active ? 'Attivo' : 'Nascosto'}</span></a>`)}
</div>

<form class="panel mt" method="post" action="/admin/partner/posizioni">
  <h2>Dove compaiono i partner</h2>
  <p class="muted" style="margin-bottom:16px">Scegli quale partner citare in ogni punto del sito. “Nessuno” toglie quella scritta.</p>
  <div class="grid2">
  ${SLOTS.map(([slot, label, where]) => html`<div class="field"><label for="slot_${slot}">${label} <span class="hint">— ${where}</span></label>
    <select id="slot_${slot}" name="slot_${slot}"><option value="">Nessuno</option>${partners.filter((p) => p.active).map((p) => html`<option value="${p.id}"${slotOf[slot] === p.id ? raw(' selected') : ''}>${p.name}</option>`)}</select></div>`)}
  </div>
  <button class="btn dark" type="submit">Salva posizioni</button>
</form>`;
  return htmlResponse(adminPage({ user, active: 'partners', title: 'Partner', body, url }));
}

export async function editPartner({ db, user, url, id }) {
  const p = id ? await db.prepare('SELECT * FROM partners WHERE id = ?').bind(id).first()
    : { name: '', tier: 'official', logo: '', url: '', sort: 99, in_strip: 1, active: 1 };
  if (!p) return redirect('/admin/partner');
  const body = html`<a class="crumb" href="/admin/partner">← Tutti i partner</a>
<div class="head"><h1>${id ? p.name : 'Nuovo partner'}</h1></div>
<form class="panel" method="post" action="/admin/partner/${id || 'nuovo'}">
  <div class="grid2">
    <div class="field"><label for="name">Nome</label><input id="name" name="name" type="text" required value="${p.name}"></div>
    <div class="field"><label for="tier">Tipo</label><select id="tier" name="tier">${TIERS.map(([v, l]) => html`<option value="${v}"${v === p.tier ? raw(' selected') : ''}>${l}</option>`)}</select></div>
    <div class="field"><label for="url">Sito web <span class="hint">(facoltativo)</span></label><input id="url" name="url" type="url" value="${p.url || ''}" placeholder="https://"></div>
    <div class="field"><label for="sort">Ordine <span class="hint">(1 = primo)</span></label><input id="sort" name="sort" type="number" min="1" max="99" value="${p.sort}"></div>
  </div>
  <label>Logo</label>
  <div class="imgbox">
    <div class="preview" id="img-preview" style="background-color:#1d1416;background-size:contain;background-origin:content-box;padding:16px;${p.logo ? `background-image:url('${p.logo}')` : ''}">${p.logo ? '' : html`<span style="color:#fff;font-weight:800">${p.name || 'Nessun logo'}</span>`}</div>
    <div>
      <input type="hidden" name="logo" id="image" value="${p.logo || ''}">
      <label class="btn" for="img-file" style="margin:0">Carica logo…</label>
      <input class="sr" type="file" id="img-file" accept="image/png,image/svg+xml,image/webp,image/jpeg" data-kind="logo">
      <p class="hint mt" id="img-status">Meglio PNG o SVG bianco su sfondo trasparente: i loghi stanno su fondo scuro.</p>
    </div>
  </div>
  <div class="actions mt">
    <label class="check"><input type="checkbox" name="in_strip" value="1"${p.in_strip ? raw(' checked') : ''}> Mostra nella fascia partner in fondo alle pagine</label>
    <label class="check"><input type="checkbox" name="active" value="1"${p.active ? raw(' checked') : ''}> Attivo (togli la spunta per nasconderlo ovunque)</label>
  </div>
  <div class="bar"><button class="btn primary" type="submit" name="action" value="save">Salva</button>
  ${id ? html`<span class="spacer"></span><button class="btn danger" type="submit" name="action" value="delete" data-confirm="Eliminare questo partner?">Elimina</button>` : ''}</div>
</form>`;
  return htmlResponse(adminPage({ user, active: 'partners', title: p.name || 'Nuovo partner', body, url }));
}

export async function savePartner({ db, id, form }) {
  if (form.get('action') === 'delete' && id) {
    await db.batch([db.prepare('UPDATE placements SET partner_id = NULL WHERE partner_id = ?').bind(id), db.prepare('DELETE FROM partners WHERE id = ?').bind(id)]);
    return redirect('/admin/partner?msg=deleted');
  }
  const name = String(form.get('name') || '').trim().slice(0, 80);
  if (!name) return redirect(`/admin/partner/${id || 'nuovo'}?msg=invalid`);
  const tier = TIERS.some((x) => x[0] === form.get('tier')) ? form.get('tier') : 'official';
  const link = /^https?:\/\//.test(form.get('url') || '') ? String(form.get('url')).slice(0, 300) : null;
  const logo = /^\/(media|assets)\//.test(form.get('logo') || '') ? form.get('logo') : null;
  const sort = Math.min(99, Math.max(1, Number(form.get('sort')) || 99));
  const inStrip = form.get('in_strip') ? 1 : 0, active = form.get('active') ? 1 : 0;
  if (id) {
    const old = await db.prepare('SELECT logo, logo_class FROM partners WHERE id = ?').bind(id).first();
    const cls = logo && logo !== old?.logo ? 'sm' : old?.logo_class;
    await db.prepare('UPDATE partners SET name = ?, tier = ?, url = ?, logo = ?, logo_class = ?, sort = ?, in_strip = ?, active = ? WHERE id = ?')
      .bind(name, tier, link, logo, cls, sort, inStrip, active, id).run();
    return redirect(`/admin/partner/${id}?msg=saved`);
  }
  const r = await db.prepare('INSERT INTO partners (name, tier, url, logo, logo_class, sort, in_strip, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(name, tier, link, logo, 'sm', sort, inStrip, active).first();
  return redirect(`/admin/partner/${r.id}?msg=created`);
}

export async function savePlacements({ db, form }) {
  const stmts = SLOTS.map(([slot]) => {
    const pid = Number(form.get(`slot_${slot}`)) || null;
    return db.prepare('INSERT INTO placements (slot, partner_id) VALUES (?, ?) ON CONFLICT(slot) DO UPDATE SET partner_id = excluded.partner_id').bind(slot, pid);
  });
  await db.batch(stmts);
  return redirect('/admin/partner?msg=saved');
}
