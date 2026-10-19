import { html, toString } from '../lib/html.js';
import { LANGS } from '../lib/i18n.js';
import * as site from '../lib/db.js';
import { translateArticle } from '../lib/translate.js';
import { articlePage } from '../views/news.js';
import * as auth from './auth.js';
import { adminPage, loginPage, setupPage, htmlResponse, redirect, flashFrom, itDate } from './ui.js';
import { listNews, createNews, editNews, saveNews } from './news.js';
import { matchesPage, saveMatches } from './matches.js';
import { partnersPage, editPartner, savePartner, savePlacements } from './partners.js';
import { accountPage, saveAccount } from './account.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function dashboard({ db, user, url }) {
  const now = site.today();
  const [missing, drafts, next, news] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS n FROM matches m JOIN competitions c ON c.id = m.competition_id WHERE c.archived = 0 AND m.status = 'scheduled' AND m.date < ?`).bind(now).first(),
    db.prepare(`SELECT COUNT(*) AS n FROM news WHERE status = 'draft'`).first(),
    site.getUpcoming(db, 1),
    db.prepare(`SELECT COUNT(*) AS n FROM news WHERE status = 'published'`).first(),
  ]);
  const teams = await site.getTeams(db);
  const nm = next[0];
  const body = html`<div class="head"><div><h1>Ciao ${user.name.split(' ')[0]}</h1><p>Da qui aggiorni notizie, risultati e partner del sito. Le modifiche sono online appena salvi o pubblichi.</p></div>
  <a class="btn" href="/pt/" target="_blank" rel="noopener">Apri il sito ↗</a></div>
<div class="grid3">
  <a class="stat${missing.n ? ' alert' : ''}" href="/admin/partite"><b>${missing.n}</b><span>${missing.n === 1 ? 'partita giocata senza risultato' : 'partite giocate senza risultato'}</span></a>
  <a class="stat" href="/admin/notizie"><b>${drafts.n}</b><span>${drafts.n === 1 ? 'notizia in bozza' : 'notizie in bozza'}</span></a>
  <a class="stat" href="/admin/notizie"><b>${news.n}</b><span>notizie pubblicate</span></a>
</div>
<div class="grid2 mt">
  <section class="panel"><h2>Prossima partita del Sal Rei</h2>
    ${nm ? html`<p style="font-size:20px;font-weight:700">${teams.get(nm.home_id)?.name} – ${teams.get(nm.away_id)?.name}</p>
      <p class="muted">${nm.comp_pt}${nm.round ? ` · Giornata ${nm.round}` : ''} · ${itDate(nm.date, true)}${nm.time ? ` · ${nm.time}` : ' · ora da definire'}</p>
      <a class="btn small mt" href="/admin/partite?c=${nm.competition_id}">Modifica data, ora o campo</a>` : html`<p class="muted">Nessuna partita in programma.</p>`}
  </section>
  <section class="panel"><h2>Cosa vuoi fare?</h2>
    <div class="actions">
      <form method="post" action="/admin/notizie/nuova"><button class="btn primary" type="submit">Scrivi una notizia</button></form>
      <a class="btn" href="/admin/partite">Inserisci i risultati</a>
      <a class="btn" href="/admin/partner">Gestisci i partner</a>
    </div>
  </section>
</div>`;
  return htmlResponse(adminPage({ user, active: 'home', title: 'Inizio', body, url }));
}

async function preview({ db, url, id }) {
  const a = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
  if (!a) return redirect('/admin/notizie');
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'pt';
  const t = LANGS[lang];
  const { partners, placements } = await site.getPartners(db);
  const more = (await site.getNewsList(db, { limit: 4 })).filter((x) => x.slug !== a.slug).slice(0, 3);
  const switcher = html`<div class="preview-bar">${lang === 'pt' ? 'Anteprima in portoghese' : 'Anteprima in inglese'} — non ancora pubblicata ·
    <a href="?lang=${lang === 'pt' ? 'en' : 'pt'}">${lang === 'pt' ? 'vedi in inglese' : 'vedi in portoghese'}</a> · <a href="/admin/notizie/${id}">torna all’editor</a></div>`;
  const page = toString(articlePage({ t, a, more, partners, placements }));
  return htmlResponse(page.replace('<body>', `<body>${toString(switcher)}`), 200, { 'x-robots-tag': 'noindex' });
}

async function upload({ env, request }) {
  if (!env.MEDIA) return json({ error: 'storage-missing' }, 500);
  const form = await request.formData().catch(() => new FormData());
  const file = form.get('file');
  const kind = form.get('kind') === 'logo' ? 'partners' : 'news';
  const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
  if (!file || typeof file === 'string' || !types[file.type] || file.size > 10 * 1024 * 1024) return json({ error: 'bad-file' }, 400);
  if (file.type === 'image/svg+xml' && kind !== 'partners') return json({ error: 'bad-file' }, 400);
  const d = new Date();
  const key = `${kind}/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID().slice(0, 12)}.${types[file.type]}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' } });
  await env.DB.prepare('INSERT INTO media (key, type, size) VALUES (?, ?, ?)').bind(key, file.type, file.size).run();
  return json({ url: `/media/${key}` });
}

async function translate({ env, request }) {
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'bad-request' }, 400); }
  const { from, to, fields } = payload || {};
  if (!['pt', 'en'].includes(from) || !['pt', 'en'].includes(to) || from === to || typeof fields !== 'object') return json({ error: 'bad-request' }, 400);
  try {
    return json({ fields: await translateArticle(env, from, to, fields) });
  } catch (e) {
    const code = ['missing-key', 'refused', 'too-long', 'empty'].includes(e.message) ? e.message : 'failed';
    console.error('translate', e);
    return json({ error: code }, code === 'missing-key' ? 503 : 502);
  }
}

export async function handleAdmin(request, env, url) {
  const db = env.DB;
  const path = url.pathname.replace(/\/+$/, '') || '/admin';
  const method = request.method;
  if (method === 'POST' && !auth.sameOrigin(request)) return new Response('Forbidden', { status: 403 });

  const userCount = (await db.prepare('SELECT COUNT(*) AS n FROM admin_users').first()).n;

  // First account, protected by the SETUP_KEY secret.
  if (path === '/admin/primo-accesso') {
    if (userCount > 0) return redirect('/admin/accedi');
    if (method === 'GET') return htmlResponse(setupPage({ error: env.SETUP_KEY ? '' : 'Prima va impostato il segreto SETUP_KEY sul Worker in Cloudflare.' }));
    const f = await request.formData().catch(() => new FormData());
    const name = String(f.get('name') || '').trim(), email = String(f.get('email') || '').trim(), pass = String(f.get('password') || '');
    if (!auth.setupKeyMatches(env, f.get('key'))) return htmlResponse(setupPage({ error: 'Chiave di attivazione non corretta.' }), 403);
    if (!name || !email.includes('@') || pass.length < 10) return htmlResponse(setupPage({ error: 'Compila tutti i campi (password di almeno 10 caratteri).' }), 400);
    const h = await auth.hashPassword(pass);
    const u = await db.prepare('INSERT INTO admin_users (email, name, pass_hash, pass_salt, is_owner) VALUES (?, ?, ?, ?, 1) RETURNING id').bind(email, name, h.hash, h.salt).first();
    return redirect('/admin', { 'set-cookie': await auth.startSession(db, u.id) });
  }

  if (path === '/admin/accedi') {
    if (userCount === 0) return redirect('/admin/primo-accesso');
    if (method === 'GET') return htmlResponse(loginPage({ flash: flashFrom(url) }));
    const f = await request.formData().catch(() => new FormData());
    if (await auth.tooManyAttempts(db, auth.clientIp(request))) return htmlResponse(loginPage({ flash: flashFrom(new URL('?msg=locked', url)), email: f.get('email') }), 429);
    const user = await auth.checkLogin(db, request, f.get('email'), f.get('password'));
    if (!user) return htmlResponse(loginPage({ flash: flashFrom(new URL('?msg=bad-login', url)), email: f.get('email') }), 401);
    return redirect('/admin', { 'set-cookie': await auth.startSession(db, user.id) });
  }

  const user = await auth.currentUser(db, request);
  if (!user) return redirect(userCount === 0 ? '/admin/primo-accesso' : '/admin/accedi');

  if (path === '/admin/esci' && method === 'POST') return redirect('/admin/accedi', { 'set-cookie': await auth.endSession(db, request) });

  const ctx = { db, env, user, url, request };
  const form = method === 'POST' && !path.startsWith('/admin/api/') ? await request.formData().catch(() => new FormData()) : null;
  let m;

  if (path === '/admin') return dashboard(ctx);

  if (path === '/admin/notizie') return listNews(ctx);
  if (path === '/admin/notizie/nuova' && method === 'POST') return createNews(ctx);
  if ((m = path.match(/^\/admin\/notizie\/(\d+)$/))) return method === 'POST' ? saveNews({ ...ctx, id: +m[1], form }) : editNews({ ...ctx, id: +m[1] });
  if ((m = path.match(/^\/admin\/notizie\/(\d+)\/anteprima$/))) return preview({ ...ctx, id: +m[1] });

  if (path === '/admin/partite') return method === 'POST' ? saveMatches({ ...ctx, form }) : matchesPage(ctx);

  if (path === '/admin/partner') return partnersPage(ctx);
  if (path === '/admin/partner/posizioni' && method === 'POST') return savePlacements({ ...ctx, form });
  if (path === '/admin/partner/nuovo') return method === 'POST' ? savePartner({ ...ctx, id: 0, form }) : editPartner({ ...ctx, id: 0 });
  if ((m = path.match(/^\/admin\/partner\/(\d+)$/))) return method === 'POST' ? savePartner({ ...ctx, id: +m[1], form }) : editPartner({ ...ctx, id: +m[1] });

  if (path === '/admin/account') return method === 'POST' ? saveAccount({ ...ctx, form }) : accountPage(ctx);

  if (path === '/admin/api/immagine' && method === 'POST') return upload(ctx);
  if (path === '/admin/api/traduci' && method === 'POST') return translate(ctx);

  return htmlResponse(adminPage({ user, active: '', title: 'Pagina non trovata', body: html`<h1>Pagina non trovata</h1><p class="mt"><a href="/admin">Torna all’inizio</a></p>` }), 404);
}

// Public delivery of uploaded images from the R2 bucket.
export async function serveMedia(env, key) {
  if (!env.MEDIA || !/^[a-z]+\/\d{4}\/\d{2}\/[a-z0-9-]+\.(jpg|png|webp|svg)$/.test(key)) return new Response('Not found', { status: 404 });
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-security-policy', "default-src 'none'; style-src 'unsafe-inline'");
  return new Response(obj.body, { headers });
}
