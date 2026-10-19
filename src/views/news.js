import { html, raw } from '../lib/html.js';
import { sanitize } from '../lib/sanitize.js';
import { url, pick, longDate } from '../lib/i18n.js';
import { page } from './layout.js';
import { acard, newsUrl, category, newsVisual, newsroomPartner } from './parts.js';

const ORDER = ['club', 'first-team', 'academy', 'history', 'regional', 'cape-verde'];

function excerpt(t, n) {
  const ex = pick(n, 'excerpt', t.lang);
  if (ex) return ex;
  const body = String(pick(n, 'body', t.lang)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return body.length > 170 ? body.slice(0, 170).replace(/\s+\S*$/, '') + '…' : body;
}

export function newsPage({ t, news, cat, partners, placements }) {
  const n = t.news;
  const cats = ORDER.filter((c) => news.some((x) => x.category === c));
  const list = cat ? news.filter((x) => x.category === cat) : news;
  const [main, ...rest] = list;
  const side = rest.slice(0, 2), grid = rest.slice(2);
  const tile = (x, cls, big) => html`<a class="${cls}" href="${newsUrl(t, x)}">
      ${newsVisual(t, x)}
      <div class="nf-fg"></div>
      <div class="nf-ct"><span class="tag">${category(t, x)}</span>
        <h3>${pick(x, 'title', t.lang)}</h3>
        ${big ? html`<p class="nf-ex">${excerpt(t, x)}</p>` : ''}
        <div class="meta">${longDate(t, x.date)}<span class="dot"></span>${x.read_min} ${n.minRead}</div></div>
    </a>`;
  const filter = (c, label) => html`<a class="filter${(cat || '') === c ? ' on' : ''}" href="${url(t.lang, '/news')}${c ? `?cat=${c}` : ''}">${label}</a>`;
  const body = html`
<section class="news-hero"><div class="wrap"><div class="inner">
  <span class="kicker">${n.kicker}</span>
  <h1>${n.h1A} <span>${n.h1B}</span></h1>
</div></div></section>

<section class="section"><div class="wrap">
  <div class="filter-row">
    ${filter('', n.all)}
    ${cats.map((c) => filter(c, n.categories[c]))}
  </div>
  ${main ? html`<div class="nfeat">
    ${tile(main, 'nf-main', true)}
    <div class="nf-side">
      ${side.map((x) => tile(x, 'nf-card', false))}
    </div>
  </div>` : html`<p class="empty-note">${n.empty}</p>`}
</div></section>
${newsroomPartner(t, placements)}
${grid.length ? html`
<section class="section" style="padding-top:56px"><div class="wrap">
  <div class="art-grid">
${grid.map((x) => acard(t, x))}
  </div>
</div></section>` : ''}
`;
  return page({ t, title: n.title, css: ['site', 'news', 'sponsor', 'news-gfx', 'news-grid'], active: 'news', path: '/news', body, partners });
}

function facts(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

export function articlePage({ t, a, more, partners, placements }) {
  const n = t.news;
  const title = pick(a, 'title', t.lang);
  const pull = pick(a, 'pull', t.lang);
  const kv = facts(pick(a, 'facts', t.lang));
  const path = `/news/${a.slug}`;
  const share = encodeURIComponent(`https://sport-sal-rei-club.mgm-523.workers.dev${url(t.lang, path)}`);
  const body = html`
<article>
<section class="art-hero">
  <div class="bg">${newsVisual(t, a)}</div>
  <div class="veil"></div>
  <div class="wrap"><div class="inner">
    <span class="tag">${category(t, a)}</span>
    <h1>${title}</h1>
    <div class="sub-meta"><span>${longDate(t, a.date)}</span><span class="dot"></span><span>${a.read_min} ${n.minRead}</span><span class="dot"></span><span>${n.by}</span></div>
  </div></div>
</section>

<section class="section"><div class="wrap">
  <div class="article art-2col"><div class="art-main">
    <a class="back-link" href="${url(t.lang, '/news')}"><i class="ti ti-arrow-left"></i>${n.back}</a>
    ${raw(sanitize(pick(a, 'body', t.lang)))}
    <div class="share"><span>${n.share}</span>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${share}" target="_blank" rel="noopener" aria-label="Facebook"><i class="ti ti-brand-facebook"></i></a>
      <a href="https://x.com/intent/post?url=${share}" target="_blank" rel="noopener" aria-label="${n.shareX}"><i class="ti ti-brand-x"></i></a>
      <a href="https://wa.me/?text=${share}" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="ti ti-brand-whatsapp"></i></a>
    </div>
  </div>${pull || kv.length ? html`<aside class="art-aside">${pull ? html`<div class="pull">${pull}</div>` : ''}${kv.length ? html`<div class="a-meta">${kv.map(([k, v]) => html`<span class="k">${k}</span><div class="v">${v}</div>`)}</div>` : ''}</aside>` : ''}</div>
</div></section>

${newsroomPartner(t, placements)}

${more.length ? html`<section class="section more-news" style="padding-top:90px"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${n.kicker}</span>${n.readNext}</h2><a href="${url(t.lang, '/news')}">${n.back} <i class="ti ti-arrow-right"></i></a></div>
  <div class="art-grid">${more.map((x) => acard(t, x, { readTime: false }))}</div>
</div></section>` : ''}
</article>
`;
  return page({ t, title, css: ['site', 'article', 'sponsor', 'article-2col'], active: 'news', path, body, partners, description: excerpt(t, a) });
}
