import { toString, html } from './lib/html.js';
import { LANGS, url } from './lib/i18n.js';
import * as db from './lib/db.js';
import { page } from './views/layout.js';
import { homePage } from './views/home.js';
import { seasonPage } from './views/season.js';
import { teamPage } from './views/team.js';
import { clubPage } from './views/club.js';
import { newsPage, articlePage } from './views/news.js';

// Old static file names → new addresses (kept so existing links and bookmarks still work).
const LEGACY = {
  '/index.html': '/', '/club.html': '/club', '/season.html': '/season',
  '/first-team.html': '/first-team', '/news.html': '/news',
};

function respond(fragment, status = 200) {
  return new Response(toString(fragment), {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
  });
}

function notFound(t, partners = []) {
  const n = t.notFound;
  return respond(page({
    t, title: n.title, css: ['site', 'article', 'sponsor'], path: '/', partners,
    body: html`<section class="art-hero"><div class="bg"><div class="gfx"><div class="big">404</div></div></div><div class="veil"></div>
<div class="wrap"><div class="inner"><h1>${n.title}</h1><div class="sub-meta"><span>${n.text}</span></div></div></div></section>
<section class="section"><div class="wrap"><a class="b b-gold" href="${url(t.lang, '/')}">${n.back} <i class="ti ti-arrow-right"></i></a></div></section>`,
  }), 404);
}

async function site(request, env, lang, path) {
  const t = LANGS[lang];
  const DB = env.DB;
  const { partners, placements } = await db.getPartners(DB);
  const common = { t, partners, placements };

  if (path === '/') {
    const [teams, last, upcoming, news] = await Promise.all([
      db.getTeams(DB), db.getLastResult(DB), db.getUpcoming(DB, 3), db.getNewsList(DB, { limit: 3 }),
    ]);
    return respond(homePage({ ...common, teams, last, upcoming, news }));
  }
  if (path === '/season') {
    const [teams, comps] = await Promise.all([db.getTeams(DB), db.getSeason(DB)]);
    return respond(seasonPage({ ...common, teams, comps }));
  }
  if (path === '/first-team') return respond(teamPage(common));
  if (path === '/club') return respond(clubPage(common));
  if (path === '/news') {
    const cat = new URL(request.url).searchParams.get('cat') || '';
    return respond(newsPage({ ...common, news: await db.getNewsList(DB), cat }));
  }
  const m = path.match(/^\/news\/([a-z0-9-]+)$/);
  if (m) {
    const a = await db.getArticle(DB, m[1]);
    if (!a) return notFound(t, partners);
    const more = (await db.getNewsList(DB, { limit: 4 })).filter((x) => x.slug !== a.slug).slice(0, 3);
    return respond(articlePage({ ...common, a, more }));
  }
  return notFound(t, partners);
}

export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    let path = u.pathname.replace(/\/+$/, '') || '/';

    // Language prefix: /pt/... ; English lives at the root.
    let lang = 'en';
    if (path === '/pt' || path.startsWith('/pt/')) { lang = 'pt'; path = path.slice(3) || '/'; }

    if (LEGACY[path]) return Response.redirect(new URL(url(lang, LEGACY[path]), u), 301);
    const old = path.match(/^\/news-([a-z0-9-]+)\.html$/);
    if (old) return Response.redirect(new URL(url(lang, `/news/${old[1]}`), u), 301);
    if (u.pathname !== '/' && u.pathname.endsWith('/') && u.pathname !== '/pt/') {
      return Response.redirect(new URL(url(lang, path) + u.search, u), 301);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    return site(request, env, lang, path);
  },
};
