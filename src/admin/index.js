import { html, toString } from '../lib/html.js';
import { LANGS } from '../lib/i18n.js';
import * as site from '../lib/db.js';
import { translateArticle } from '../lib/translate.js';
import { articlePage } from '../views/news.js';
import * as auth from './auth.js';
import { adminPage, loginPage, setupPage, htmlResponse, redirect, flashFrom } from './ui.js';
import { adminT, adminDate, guessLang } from './i18n.js';
import { listNews, createNews, editNews, saveNews } from './news.js';
import { matchesPage, saveMatches } from './matches.js';
import { partnersPage, editPartner, savePartner, savePlacements } from './partners.js';
import { accountPage, saveAccount, setLanguage } from './account.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function dashboard({ db, user, url }) {
  const L = adminT(user.lang), D = L.dash;
  const now = site.today();
  const [missing, drafts, next, news] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS n FROM matches m JOIN competitions c ON c.id = m.competition_id WHERE c.archived = 0 AND m.status = 'scheduled' AND m.date < ?`).bind(now).first(),
    db.prepare(`SELECT COUNT(*) AS n FROM news WHERE status = 'draft'`).first(),
    site.getUpcoming(db, 1),
    db.prepare(`SELECT COUNT(*) AS n FROM news WHERE status = 'published'`).first(),
  ]);
  const teams = await site.getTeams(db);
  const nm = next[0];
  const body = html`<div class="head"><div><h1>${D.hello} ${user.name.split(' ')[0]}</h1><p>${D.intro}</p></div>
  <a class="btn" href="/pt/" target="_blank" rel="noopener">${D.openSite}</a></div>
<div class="grid3">
  <a class="stat${missing.n ? ' alert' : ''}" href="/admin/partite"><b>${missing.n}</b><span>${missing.n === 1 ? D.missing1 : D.missingN}</span></a>
  <a class="stat" href="/admin/notizie"><b>${drafts.n}</b><span>${drafts.n === 1 ? D.drafts1 : D.draftsN}</span></a>
  <a class="stat" href="/admin/notizie"><b>${news.n}</b><span>${D.published}</span></a>
</div>
<div class="grid2 mt">
  <section class="panel"><h2>${D.next}</h2>
    ${nm ? html`<p style="font-size:20px;font-weight:700">${teams.get(nm.home_id)?.name} – ${teams.get(nm.away_id)?.name}</p>
      <p class="muted">${nm.comp_pt}${nm.round ? ` · ${D.round} ${nm.round}` : ''} · ${adminDate(L, nm.date, true)}${nm.time ? ` · ${nm.time}` : ` · ${D.noTime}`}</p>
      <a class="btn small mt" href="/admin/partite?c=${nm.competition_id}">${D.editMatch}</a>` : html`<p class="muted">${D.noNext}</p>`}
  </section>
  <section class="panel"><h2>${D.todo}</h2>
    <div class="actions">
      <form method="post" action="/admin/notizie/nuova"><button class="btn primary" type="submit">${D.write}</button></form>
      <a class="btn" href="/admin/partite">${D.results}</a>
      <a class="btn" href="/admin/partner">${D.partners}</a>
    </div>
  </section>
</div>`;
  return htmlResponse(adminPage({ user, active: 'home', title: L.nav.home, body, url }));
}

async function preview({ db, user, url, id }) {
  const N = adminT(user.lang).news;
  const a = await db.prepare('SELECT * FROM news WHERE id = ?').bind(id).first();
  if (!a) return redirect('/admin/notizie');
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'pt';
  const t = LANGS[lang];
  const { partners, placements } = await site.getPartners(db);
  const more = (await site.getNewsList(db, { limit: 4 })).filter((x) => x.slug !== a.slug).slice(0, 3);
  const other = lang === 'pt' ? 'en' : 'pt';
  const switcher = html`<div class="preview-bar">${N.previewBar[lang]} — ${N.notPublished} ·
    <a href="?lang=${other}">${N.seeIn[other]}</a> · <a href="/admin/notizie/${id}">${N.backToEditor}</a></div>`;
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

  // Before login, the language comes from ?lang= or the browser.
  const G = adminT(guessLang(request, url));

  // First account, protected by the SETUP_KEY secret.
  if (path === '/admin/primo-accesso') {
    if (userCount > 0) return redirect('/admin/accedi');
    if (method === 'GET') return htmlResponse(setupPage({ L: G, error: env.SETUP_KEY ? '' : G.setup.noKey }));
    const f = await request.formData().catch(() => new FormData());
    const name = String(f.get('name') || '').trim(), email = String(f.get('email') || '').trim(), pass = String(f.get('password') || '');
    if (!auth.setupKeyMatches(env, f.get('key'))) return htmlResponse(setupPage({ L: G, error: G.setup.badKey }), 403);
    if (!name || !email.includes('@') || pass.length < 10) return htmlResponse(setupPage({ L: G, error: G.setup.missing }), 400);
    const h = await auth.hashPassword(pass);
    const u = await db.prepare('INSERT INTO admin_users (email, name, pass_hash, pass_salt, is_owner, lang) VALUES (?, ?, ?, ?, 1, ?) RETURNING id').bind(email, name, h.hash, h.salt, G.lang).first();
    return redirect('/admin', { 'set-cookie': await auth.startSession(db, u.id) });
  }

  if (path === '/admin/accedi') {
    if (userCount === 0) return redirect('/admin/primo-accesso');
    if (method === 'GET') return htmlResponse(loginPage({ L: G, flash: flashFrom(G, url) }));
    const f = await request.formData().catch(() => new FormData());
    if (await auth.tooManyAttempts(db, auth.clientIp(request))) return htmlResponse(loginPage({ L: G, flash: ['err', G.flash.locked], email: f.get('email') }), 429);
    const user = await auth.checkLogin(db, request, f.get('email'), f.get('password'));
    if (!user) return htmlResponse(loginPage({ L: G, flash: ['err', G.flash['bad-login']], email: f.get('email') }), 401);
    return redirect('/admin', { 'set-cookie': await auth.startSession(db, user.id) });
  }

  const user = await auth.currentUser(db, request);
  if (!user) return redirect(userCount === 0 ? '/admin/primo-accesso' : '/admin/accedi');

  if (path === '/admin/esci' && method === 'POST') return redirect(`/admin/accedi?lang=${user.lang}`, { 'set-cookie': await auth.endSession(db, request) });

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
  if (path === '/admin/lingua' && method === 'POST') return setLanguage({ ...ctx, form });

  if (path === '/admin/api/immagine' && method === 'POST') return upload(ctx);
  if (path === '/admin/api/traduci' && method === 'POST') return translate(ctx);

  const L = adminT(user.lang);
  return htmlResponse(adminPage({ user, active: '', title: L.notFound, body: html`<h1>${L.notFound}</h1><p class="mt"><a href="/admin">${L.backHome}</a></p>` }), 404);
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
