import { html, raw } from '../lib/html.js';
import { sanitize } from '../lib/sanitize.js';
import { today } from '../lib/db.js';
import { adminPage, htmlResponse, redirect, itDate } from './ui.js';

const CATEGORIES = [['club', 'Club'], ['first-team', 'Prima squadra'], ['academy', 'Accademia'], ['history', 'Storia'], ['regional', 'Calcio regionale'], ['cape-verde', 'Capo Verde']];
const POSITIONS = [['center 30%', 'Alto'], ['center 50%', 'Centro'], ['center 70%', 'Basso']];
const LANG_LABEL = { pt: 'Portoghese', en: 'Inglese' };

const plain = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const isComplete = (n, l) => !!(String(n[`title_${l}`] || '').trim() && plain(n[`body_${l}`]));

export function slugify(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '') || 'noticia';
}

// Clean body HTML: allowed tags only, first paragraph becomes the lead.
export function prepareBody(raw) {
  // Browsers may wrap new lines in <div>: treat them as paragraphs.
  const blocks = String(raw || '').replace(/<div[^>]*>/gi, '<p>').replace(/<\/div>/gi, '</p>');
  let body = sanitize(blocks).replace(/<p class="lead">/g, '<p>').replace(/<p>\s*(<br>)?\s*<\/p>/g, '').trim();
  // Text typed before any paragraph gets one of its own.
  body = body.replace(/^(?!<)([\s\S]*?)(?=<(?:p|h2|h3|ul|ol|blockquote)\b|$)/, (m, t) => (t.trim() ? `<p>${t.trim()}</p>` : ''));
  body = body.replace(/<p>/, '<p class="lead">');
  return body;
}

function parseFacts(form, l) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const k = String(form.get(`fact_k_${l}_${i}`) || '').trim(), v = String(form.get(`fact_v_${l}_${i}`) || '').trim();
    if (k || v) out.push([k, v]);
  }
  return out;
}

// ---------- list ----------

export async function listNews({ db, user, url }) {
  const { results } = await db.prepare(`SELECT id, slug, status, date, category, image, gfx_big, title_pt, title_en, body_pt, body_en
    FROM news ORDER BY (status = 'draft') DESC, date DESC, id DESC`).all();
  const body = html`<div class="head"><div><h1>Notizie</h1><p>Le bozze sono visibili solo qui. Pubblica quando titolo e testo sono pronti in tutte e due le lingue.</p></div>
  <form method="post" action="/admin/notizie/nuova"><button class="btn primary" type="submit">+ Nuova notizia</button></form></div>
  <div class="list">
  ${results.map((n) => html`<a class="row" href="/admin/notizie/${n.id}">
    ${n.image ? html`<img class="thumb" src="${n.image}" alt="">` : html`<span class="thumb">${n.gfx_big || '—'}</span>`}
    <span class="grow"><span class="t">${n.title_pt || n.title_en || 'Senza titolo'}</span>
    <span class="s">${itDate(n.date)} · ${CATEGORIES.find((c) => c[0] === n.category)?.[1] || n.category}
      ${!isComplete(n, 'pt') ? html` · <span class="pill miss">manca PT</span>` : ''}${!isComplete(n, 'en') ? html` · <span class="pill miss">manca EN</span>` : ''}</span></span>
    <span class="pill ${n.status === 'published' ? 'pub' : 'draft'}">${n.status === 'published' ? 'Pubblicata' : 'Bozza'}</span>
  </a>`)}
  </div>`;
  return htmlResponse(adminPage({ user, active: 'news', title: 'Notizie', body, url }));
}

export async function createNews({ db }) {
  const r = await db.prepare(`INSERT INTO news (slug, status, date, category) VALUES (?, 'draft', ?, 'club') RETURNING id`)
    .bind(`bozza-${crypto.randomUUID().slice(0, 8)}`, today()).first();
  return redirect(`/admin/notizie/${r.id}`);
}

// ---------- editor ----------

function langColumn(n, l) {
  const other = l === 'pt' ? 'en' : 'pt';
  const facts = (() => { try { return JSON.parse(n[`facts_${l}`] || '[]'); } catch { return []; } })();
  return html`<section class="lang-col${isComplete(n, l) ? '' : ' missing'}" data-lang="${l}">
  <h2><span><span class="flag">${l.toUpperCase()}</span>${LANG_LABEL[l]}</span>
    <button class="btn small" type="button" data-translate="${other}:${l}">Traduci dal${other === 'pt' ? ' portoghese' : 'l’inglese'}</button></h2>
  <div class="field"><label for="title_${l}">Titolo</label><input id="title_${l}" name="title_${l}" type="text" value="${n[`title_${l}`] || ''}" maxlength="140"></div>
  <div class="field"><label>Testo <span class="hint">— il primo paragrafo è l’introduzione in evidenza</span></label>
    <div class="tools" role="toolbar" aria-label="Formattazione">
      <button type="button" data-cmd="formatBlock" data-arg="p" title="Paragrafo">¶</button>
      <button type="button" data-cmd="formatBlock" data-arg="h2" title="Sottotitolo">Sottotitolo</button>
      <button type="button" data-cmd="bold" title="Grassetto"><b>G</b></button>
      <button type="button" data-cmd="italic" title="Corsivo"><i>C</i></button>
      <button type="button" data-cmd="insertUnorderedList" title="Elenco">• Elenco</button>
      <button type="button" data-cmd="link" title="Link">Link</button>
    </div>
    <div class="editor" contenteditable="true" data-for="body_${l}" data-placeholder="Scrivi qui il testo della notizia…">${raw(sanitize(n[`body_${l}`] || ''))}</div>
    <textarea name="body_${l}" class="sr" aria-hidden="true" tabindex="-1">${n[`body_${l}`] || ''}</textarea>
  </div>
  <div class="field"><label for="excerpt_${l}">Riassunto <span class="hint">(facoltativo — se vuoto si usa l’inizio del testo)</span></label><textarea id="excerpt_${l}" name="excerpt_${l}" rows="2">${n[`excerpt_${l}`] || ''}</textarea></div>
  <div class="field"><label for="pull_${l}">Frase in evidenza <span class="hint">(facoltativa, a lato del testo)</span></label><input id="pull_${l}" name="pull_${l}" type="text" value="${n[`pull_${l}`] || ''}"></div>
  <div class="field"><label>Dati in breve <span class="hint">(facoltativi, es. “Stagione” → “2026/27”)</span></label>
    ${[0, 1, 2].map((i) => html`<div class="facts-row"><input type="text" name="fact_k_${l}_${i}" placeholder="Voce" value="${facts[i]?.[0] || ''}" aria-label="Voce ${i + 1}"><input type="text" name="fact_v_${l}_${i}" placeholder="Valore" value="${facts[i]?.[1] || ''}" aria-label="Valore ${i + 1}"></div>`)}
  </div>
  <div class="field"><label for="gfx_cap_${l}">Didascalia della grafica <span class="hint">(se non c’è la foto)</span></label><input id="gfx_cap_${l}" name="gfx_cap_${l}" type="text" value="${n[`gfx_cap_${l}`] || ''}"></div>
</section>`;
}

export async function editNews({ db, user, url, id }) {
  const n = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
  if (!n) return redirect('/admin/notizie');
  const published = n.status === 'published';
  const live = published ? `/pt/news/${n.slug}` : null;
  const body = html`<a class="crumb" href="/admin/notizie">← Tutte le notizie</a>
<div class="head"><div><h1>${n.title_pt || n.title_en || 'Nuova notizia'}</h1>
  <p><span class="pill ${published ? 'pub' : 'draft'}">${published ? 'Pubblicata' : 'Bozza'}</span>${live ? html` · <a href="${live}" target="_blank" rel="noopener">vedi sul sito</a>` : ''}</p></div></div>
<form method="post" id="news-form" data-news-id="${n.id}">
  <div class="panel">
    <div class="grid3">
      <div class="field"><label for="date">Data</label><input id="date" name="date" type="date" value="${n.date}" required></div>
      <div class="field"><label for="category">Categoria</label><select id="category" name="category">${CATEGORIES.map(([v, l]) => html`<option value="${v}"${v === n.category ? raw(' selected') : ''}>${l}</option>`)}</select></div>
      <div class="field"><label for="gfx_big">Grafica senza foto <span class="hint">(numero o parola corta)</span></label><input id="gfx_big" name="gfx_big" type="text" maxlength="8" value="${n.gfx_big || ''}" placeholder="es. 2004"></div>
    </div>
    <label>Foto</label>
    <div class="imgbox">
      <div class="preview" id="img-preview" style="${n.image ? `background-image:url('${n.image}');background-position:${n.image_pos || 'center'}` : ''}">${n.image ? '' : 'Nessuna foto: verrà mostrata la grafica'}</div>
      <div>
        <input type="hidden" name="image" id="image" value="${n.image || ''}">
        <div class="actions">
          <label class="btn" for="img-file" style="margin:0">Carica foto…</label>
          <input class="sr" type="file" id="img-file" accept="image/jpeg,image/png,image/webp">
          ${n.image ? html`<button class="btn ghost" type="button" id="img-remove">Togli foto</button>` : ''}
        </div>
        <p class="hint mt" id="img-status">JPG o PNG. La foto viene ridimensionata automaticamente.</p>
        <div class="field mt"><label for="image_pos">Inquadratura</label><select id="image_pos" name="image_pos">${POSITIONS.map(([v, l]) => html`<option value="${v}"${v === (n.image_pos || 'center 50%') ? raw(' selected') : ''}>${l}</option>`)}</select></div>
      </div>
    </div>
  </div>
  <div class="langs mt">
    ${langColumn(n, 'pt')}
    ${langColumn(n, 'en')}
  </div>
  <div class="bar">
    <button class="btn dark" type="submit" name="action" value="save">Salva bozza</button>
    <button class="btn" type="submit" name="action" value="preview" formtarget="_blank">Anteprima</button>
    <span class="spacer"></span>
    ${published
      ? html`<button class="btn" type="submit" name="action" value="unpublish">Ritira dal sito</button><button class="btn primary" type="submit" name="action" value="publish">Salva e aggiorna il sito</button>`
      : html`<button class="btn primary" type="submit" name="action" value="publish">Pubblica</button>`}
    <button class="btn danger" type="submit" name="action" value="delete" data-confirm="Eliminare definitivamente questa notizia?">Elimina</button>
  </div>
</form>`;
  return htmlResponse(adminPage({ user, active: 'news', title: n.title_pt || 'Notizia', body, url }));
}

export async function saveNews({ db, id, form }) {
  const n = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
  if (!n) return redirect('/admin/notizie');
  const action = form.get('action');
  if (action === 'delete') {
    await db.prepare('DELETE FROM news WHERE id = ?').bind(id).run();
    return redirect('/admin/notizie?msg=deleted');
  }
  const v = {};
  for (const l of ['pt', 'en']) {
    v[`title_${l}`] = String(form.get(`title_${l}`) || '').trim() || null;
    v[`excerpt_${l}`] = String(form.get(`excerpt_${l}`) || '').trim() || null;
    v[`pull_${l}`] = String(form.get(`pull_${l}`) || '').trim() || null;
    v[`gfx_cap_${l}`] = String(form.get(`gfx_cap_${l}`) || '').trim() || null;
    const b = prepareBody(form.get(`body_${l}`));
    v[`body_${l}`] = plain(b) ? b : null;
    const f = parseFacts(form, l);
    v[`facts_${l}`] = f.length ? JSON.stringify(f) : null;
  }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(form.get('date')) ? form.get('date') : n.date;
  const category = CATEGORIES.some((c) => c[0] === form.get('category')) ? form.get('category') : 'club';
  const image = String(form.get('image') || '').trim();
  v.image = /^\/(media|assets)\//.test(image) ? image : null;
  v.image_pos = POSITIONS.some((p) => p[0] === form.get('image_pos')) ? form.get('image_pos') : null;
  v.gfx_big = String(form.get('gfx_big') || '').trim().slice(0, 8) || null;
  const words = plain(v.body_pt || v.body_en).split(' ').filter(Boolean).length;
  v.read_min = Math.max(1, Math.round(words / 200));

  // A draft gets its address from the title; published addresses never change.
  let slug = n.slug;
  if (slug.startsWith('bozza-') && (v.title_pt || v.title_en)) {
    const base = slugify(v.title_pt || v.title_en);
    slug = base;
    for (let i = 2; await db.prepare('SELECT 1 FROM news WHERE slug = ? AND id != ?').bind(slug, id).first(); i++) slug = `${base}-${i}`;
  }

  let status = n.status;
  let msg = 'saved';
  if (action === 'publish') {
    if (isComplete(v, 'pt') && isComplete(v, 'en')) { status = 'published'; msg = 'published'; }
    else msg = 'need-both';
  }
  if (action === 'unpublish') { status = 'draft'; msg = 'unpublished'; }

  const cols = Object.keys(v);
  await db.prepare(`UPDATE news SET ${cols.map((c) => `${c} = ?`).join(', ')}, date = ?, category = ?, slug = ?, status = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(...cols.map((c) => v[c]), date, category, slug, status, id).run();

  if (action === 'preview') return redirect(`/admin/notizie/${id}/anteprima`);
  return redirect(`/admin/notizie/${id}?msg=${msg}`);
}
