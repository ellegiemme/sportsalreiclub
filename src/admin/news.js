import { html, raw } from '../lib/html.js';
import { sanitize } from '../lib/sanitize.js';
import { today } from '../lib/db.js';
import { adminPage, htmlResponse, redirect } from './ui.js';
import { adminT, adminDate } from './i18n.js';

const CATEGORIES = ['club', 'first-team', 'academy', 'history', 'regional', 'cape-verde'];
const POSITIONS = ['center 30%', 'center 50%', 'center 70%'];

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
  const L = adminT(user.lang), N = L.news;
  const { results } = await db.prepare(`SELECT id, slug, status, date, category, image, gfx_big, title_pt, title_en, body_pt, body_en
    FROM news ORDER BY (status = 'draft') DESC, date DESC, id DESC`).all();
  const title = (n) => n.title_pt || n.title_en || N.untitled;
  const body = html`<div class="head"><div><h1>${N.title}</h1><p>${N.intro}</p></div>
  <form method="post" action="/admin/notizie/nuova"><button class="btn primary" type="submit">${N.add}</button></form></div>
  <div class="list">
  ${results.map((n) => html`<a class="row" href="/admin/notizie/${n.id}">
    ${n.image ? html`<img class="thumb" src="${n.image}" alt="">` : html`<span class="thumb">${n.gfx_big || '—'}</span>`}
    <span class="grow"><span class="t">${title(n)}</span>
    <span class="s">${adminDate(L, n.date)} · ${N.categories[n.category] || n.category}
      ${!isComplete(n, 'pt') ? html` · <span class="pill miss">${N.missing} PT</span>` : ''}${!isComplete(n, 'en') ? html` · <span class="pill miss">${N.missing} EN</span>` : ''}</span></span>
    <span class="pill ${n.status === 'published' ? 'pub' : 'draft'}">${n.status === 'published' ? N.published : N.draft}</span>
  </a>`)}
  </div>`;
  return htmlResponse(adminPage({ user, active: 'news', title: N.title, body, url }));
}

export async function createNews({ db }) {
  const r = await db.prepare(`INSERT INTO news (slug, status, date, category) VALUES (?, 'draft', ?, 'club') RETURNING id`)
    .bind(`bozza-${crypto.randomUUID().slice(0, 8)}`, today()).first();
  return redirect(`/admin/notizie/${r.id}`);
}

// ---------- editor ----------

function langColumn(N, n, l) {
  const other = l === 'pt' ? 'en' : 'pt';
  const T = N.tools;
  const facts = (() => { try { return JSON.parse(n[`facts_${l}`] || '[]'); } catch { return []; } })();
  return html`<section class="lang-col${isComplete(n, l) ? '' : ' missing'}" data-lang="${l}">
  <h2><span><span class="flag">${l.toUpperCase()}</span>${N.langs[l]}</span>
    <button class="btn small" type="button" data-translate="${other}:${l}">${N.translateFrom[other]}</button></h2>
  <div class="field"><label for="title_${l}">${N.headline}</label><input id="title_${l}" name="title_${l}" type="text" value="${n[`title_${l}`] || ''}" maxlength="140"></div>
  <div class="field"><label>${N.body} <span class="hint">${N.bodyHint}</span></label>
    <div class="tools" role="toolbar" aria-label="${T.toolbar}">
      <button type="button" data-cmd="formatBlock" data-arg="p" title="${T.p}">¶</button>
      <button type="button" data-cmd="formatBlock" data-arg="h2" title="${T.h2}">${T.h2}</button>
      <button type="button" data-cmd="bold" title="${T.bold}"><b>${T.boldKey}</b></button>
      <button type="button" data-cmd="italic" title="${T.italic}"><i>${T.italicKey}</i></button>
      <button type="button" data-cmd="insertUnorderedList" title="${T.list}">${T.list}</button>
      <button type="button" data-cmd="link" title="${T.link}">${T.link}</button>
    </div>
    <div class="editor" contenteditable="true" data-for="body_${l}" data-placeholder="${N.placeholder}">${raw(sanitize(n[`body_${l}`] || ''))}</div>
    <textarea name="body_${l}" class="sr" aria-hidden="true" tabindex="-1">${n[`body_${l}`] || ''}</textarea>
  </div>
  <div class="field"><label for="excerpt_${l}">${N.excerpt} <span class="hint">${N.excerptHint}</span></label><textarea id="excerpt_${l}" name="excerpt_${l}" rows="2">${n[`excerpt_${l}`] || ''}</textarea></div>
  <div class="field"><label for="pull_${l}">${N.pull} <span class="hint">${N.pullHint}</span></label><input id="pull_${l}" name="pull_${l}" type="text" value="${n[`pull_${l}`] || ''}"></div>
  <div class="field"><label>${N.facts} <span class="hint">${N.factsHint}</span></label>
    ${[0, 1, 2].map((i) => html`<div class="facts-row"><input type="text" name="fact_k_${l}_${i}" placeholder="${N.factKey}" value="${facts[i]?.[0] || ''}" aria-label="${N.factKey} ${i + 1}"><input type="text" name="fact_v_${l}_${i}" placeholder="${N.factValue}" value="${facts[i]?.[1] || ''}" aria-label="${N.factValue} ${i + 1}"></div>`)}
  </div>
  <div class="field"><label for="gfx_cap_${l}">${N.gfxCap} <span class="hint">${N.gfxCapHint}</span></label><input id="gfx_cap_${l}" name="gfx_cap_${l}" type="text" value="${n[`gfx_cap_${l}`] || ''}"></div>
</section>`;
}

export async function editNews({ db, user, url, id }) {
  const L = adminT(user.lang), N = L.news;
  const n = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
  if (!n) return redirect('/admin/notizie');
  const published = n.status === 'published';
  const live = published ? `/pt/news/${n.slug}` : null;
  const heading = n.title_pt || n.title_en || N.newTitle;
  const body = html`<a class="crumb" href="/admin/notizie">${N.all}</a>
<div class="head"><div><h1>${heading}</h1>
  <p><span class="pill ${published ? 'pub' : 'draft'}">${published ? N.published : N.draft}</span>${live ? html` · <a href="${live}" target="_blank" rel="noopener">${N.viewLive}</a>` : ''}</p></div></div>
<form method="post" id="news-form" data-news-id="${n.id}">
  <div class="panel">
    <div class="grid3">
      <div class="field"><label for="date">${N.date}</label><input id="date" name="date" type="date" value="${n.date}" required></div>
      <div class="field"><label for="category">${N.category}</label><select id="category" name="category">${CATEGORIES.map((v) => html`<option value="${v}"${v === n.category ? raw(' selected') : ''}>${N.categories[v]}</option>`)}</select></div>
      <div class="field"><label for="gfx_big">${N.gfx} <span class="hint">${N.gfxHint}</span></label><input id="gfx_big" name="gfx_big" type="text" maxlength="8" value="${n.gfx_big || ''}" placeholder="${N.gfxPh}"></div>
    </div>
    <label>${N.photo}</label>
    <div class="imgbox">
      <div class="preview" id="img-preview" style="${n.image ? `background-image:url('${n.image}');background-position:${n.image_pos || 'center'}` : ''}">${n.image ? '' : N.noPhoto}</div>
      <div>
        <input type="hidden" name="image" id="image" value="${n.image || ''}">
        <div class="actions">
          <label class="btn" for="img-file" style="margin:0">${N.upload}</label>
          <input class="sr" type="file" id="img-file" accept="image/jpeg,image/png,image/webp">
          ${n.image ? html`<button class="btn ghost" type="button" id="img-remove">${N.removePhoto}</button>` : ''}
        </div>
        <p class="hint mt" id="img-status">${N.photoHint}</p>
        <div class="field mt"><label for="image_pos">${N.framing}</label><select id="image_pos" name="image_pos">${POSITIONS.map((v) => html`<option value="${v}"${v === (n.image_pos || 'center 50%') ? raw(' selected') : ''}>${N.positions[v]}</option>`)}</select></div>
      </div>
    </div>
  </div>
  <div class="langs mt">
    ${langColumn(N, n, 'pt')}
    ${langColumn(N, n, 'en')}
  </div>
  <div class="bar">
    <button class="btn dark" type="submit" name="action" value="save">${N.save}</button>
    <button class="btn" type="submit" name="action" value="preview" formtarget="_blank">${N.preview}</button>
    <span class="spacer"></span>
    ${published
      ? html`<button class="btn" type="submit" name="action" value="unpublish">${N.unpublish}</button><button class="btn primary" type="submit" name="action" value="publish">${N.update}</button>`
      : html`<button class="btn primary" type="submit" name="action" value="publish">${N.publish}</button>`}
    <button class="btn danger" type="submit" name="action" value="delete" data-confirm="${N.confirmDelete}">${N.delete}</button>
  </div>
</form>`;
  return htmlResponse(adminPage({ user, active: 'news', title: heading, body, url }));
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
  const category = CATEGORIES.includes(form.get('category')) ? form.get('category') : 'club';
  const image = String(form.get('image') || '').trim();
  v.image = /^\/(media|assets)\//.test(image) ? image : null;
  v.image_pos = POSITIONS.includes(form.get('image_pos')) ? form.get('image_pos') : null;
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
