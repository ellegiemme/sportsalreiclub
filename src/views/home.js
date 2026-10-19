import { html, raw } from '../lib/html.js';
import { url, pick, longDate } from '../lib/i18n.js';
import { page, partnerLogo } from './layout.js';
import { newsUrl, category, newsVisual, teamName, teamShort, compName, roundLabel, shortDate, dayMonth } from './parts.js';

const TROPHY = raw('<svg class="cup" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h10v3.4c0 3.2 -2.15 5.6 -5 5.6s-5 -2.4 -5 -5.6z"/><path d="M7 4c-2.4 -0.35 -3.8 0.9 -3.8 2.9c0 2.2 1.8 3.35 3.6 3.5"/><path d="M17 4c2.4 -0.35 3.8 0.9 3.8 2.9c0 2.2 -1.8 3.35 -3.6 3.5"/><path d="M12 12.5v3"/><path d="M10.4 15.5h3.2"/><path d="M8.4 20.5h7.2v-2c0 -0.6 -0.5 -1.1 -1.1 -1.1h-5c-0.6 0 -1.1 0.5 -1.1 1.1z"/></svg>');

function compLine(t, m) {
  const r = roundLabel(t, m);
  return r ? `${compName(t, m)} — ${r}` : compName(t, m);
}

function nextbar(t, teams, last, next, matchday) {
  const left = last ? html`<div class="col col-left">
    <span class="lbl">${t.home.lastResult}</span>
    <div class="mt"><span>${teamName(teams, last.home_id)}</span><span class="score">${last.home_score} - ${last.away_score}</span><span>${teamName(teams, last.away_id)}</span></div>
    <span class="comp">${compLine(t, last)}</span>
    <div class="info">
      <span><i class="ti ti-calendar"></i>${shortDate(t, last.date)}</span>
      ${last.time ? html`<span><i class="ti ti-clock"></i>${last.time}</span>` : ''}
      ${last.venue ? html`<span><i class="ti ti-map-pin"></i>${last.venue}</span>` : ''}
    </div>
  </div>` : html`<div class="col col-left"></div>`;
  const right = next ? html`<div class="col col-right">
    <span class="lbl">${t.home.nextMatch}</span>
    <div class="mt"><span>${teamName(teams, next.home_id)}</span><span class="vs">${t.match.vs}</span><span>${teamName(teams, next.away_id)}</span></div>
    <span class="comp">${compLine(t, next)}</span>
    <div class="info">
      <span>${shortDate(t, next.date)}<i class="ti ti-calendar"></i></span>
      <span>${next.time || t.match.timeTbc}<i class="ti ti-clock"></i></span>
      ${next.venue ? html`<span>${next.venue}<i class="ti ti-map-pin"></i></span>` : ''}
    </div>
</div>` : html`<div class="col col-right"></div>`;
  return html`<div class="nextbar"><div class="wrap">
  ${left}
  <div class="crest"><img src="/assets/img/crest-large.png" alt="Sal Rei"></div>
  ${right}
${matchday ? html`<div class="sp-matchday"><span class="pby">${t.home.matchdayPartner}</span>${partnerLogo(matchday, 'md')}</div>` : ''}</div></div>`;
}

function newsBlock(t, news) {
  if (!news.length) return '';
  const [feat, ...side] = news;
  const sideCard = (n, i) => html`<a class="nc g${i + 1}" href="${newsUrl(t, n)}">${n.image ? newsVisual(t, n, 'pic') : html`<div class="ph">${newsVisual(t, n)}</div>`}<div class="fg"></div>
        <div class="ct"><span class="tag">${category(t, n)}</span><h3>${pick(n, 'title', t.lang)}</h3><div class="meta">${longDate(t, n.date)}</div></div></a>`;
  return html`<section class="section news-sec"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${t.home.newsEyebrow}</span>${t.home.newsTitle}</h2><a href="${url(t.lang, '/news')}">${t.home.allNews} <i class="ti ti-arrow-right"></i></a></div>
  <div class="news-grid">
    <a class="feat" href="${newsUrl(t, feat)}">${feat.image ? newsVisual(t, feat, 'pic') : html`<div class="ph">${newsVisual(t, feat)}</div>`}<div class="fg"></div>
      <div class="ftx"><span class="tag">${category(t, feat)}</span><h3>${pick(feat, 'title', t.lang)}</h3><div class="meta">${category(t, feat)} — ${longDate(t, feat.date)}</div></div></a>
    <div class="news-side">
      ${side.slice(0, 2).map(sideCard)}
    </div>
  </div>
</div></section>`;
}

function fixtures(t, teams, upcoming) {
  const card = (m) => html`<div class="match"><div class="comp"><span>${compName(t, m)}</span><span>${dayMonth(t, m.date)}</span></div>
    <div class="teams"><div class="tm"><div class="crest ${teams.get(m.home_id)?.is_us ? 'h' : 'a'}">${teamShort(teams, m.home_id)}</div><div class="nm">${teamName(teams, m.home_id)}</div></div>
    <div class="cvs">${t.match.vs.toUpperCase()}<span class="h2">${m.time || dayMonth(t, m.date)}</span></div>
    <div class="tm"><div class="crest ${teams.get(m.away_id)?.is_us ? 'h' : 'a'}">${teamShort(teams, m.away_id)}</div><div class="nm">${teamName(teams, m.away_id)}</div></div></div>
    <div class="mfoot"><i class="ti ti-map-pin"></i>${m.venue || roundLabel(t, m) || compName(t, m)}${m.time ? raw(` &middot; ${m.time}`) : ''}</div></div>`;
  return html`<section class="section fixtures-sec"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${t.home.fixturesEyebrow}</span>${t.home.fixturesTitle}</h2><a href="${url(t.lang, '/season')}">${t.home.fullFixtures} <i class="ti ti-arrow-right"></i></a></div>
  ${upcoming.length ? html`<div class="matches">${upcoming.map(card)}</div>` : html`<p class="empty-note">${t.home.noUpcoming}</p>`}
</div></section>`;
}

export function homePage({ t, teams, last, upcoming, news, partners, placements }) {
  const h = t.home, u = (p) => url(t.lang, p);
  const kit = ['kit-home-2526', 'kit-home-front', 'kit-player-tunnel', 'kit-player-wearing', 'kit-sleeve-detail'];
  const main = placements.main_band;
  const cardImgs = [['m1', '#', 'kit-player-wearing'], ['m2', u('/news/academy'), 'academy-player'], ['m3', u('/club'), 'matchday-arsenio-ramos']];
  const body = html`<section class="hero">
  <div class="grad"></div>
  <div class="wrap"><div class="inner">
    <h1>${h.heroA}<br><span>${h.heroB}</span></h1>
    <p class="sub">${h.sub}</p>
    <div class="acts"><a class="b b-gold" href="${u('/season')}">${h.ctaFixtures} <i class="ti ti-arrow-right"></i></a><a class="b b-line" href="${u('/club')}">${h.ctaStory}</a></div>
  </div></div>
</section>
${nextbar(t, teams, last, upcoming[0], placements.matchday)}
<section class="section about-band"><div class="wrap">
  <div class="about">
    <div class="txt">
      <span class="eyebrow">${h.aboutEyebrow}</span>
      <h2>${h.aboutTitleA}<br>${h.aboutTitleB}</h2>
      <p>${h.aboutP1}
      <p>${h.aboutP2}</p>
      <a class="cta" href="${u('/club')}">${h.aboutCta} <i class="ti ti-arrow-right"></i></a>
    </div>
    <div class="visual"><img src="/assets/img/title-celebration-fans.jpg" alt="${h.aboutImgAlt}"></div>
  </div>
</div></section>
${newsBlock(t, news)}
${fixtures(t, teams, upcoming)}
<section class="section shop-band"><div class="wrap">
  <div class="shop">
    <div class="left">
      <div class="img"><img src="/assets/img/kit-detail.jpg" alt="${h.kitAlts[0]}"></div>
      <a class="promo" href="#" aria-label="${h.shopAria}">
        <span class="kbadge">${h.shopBadge}</span>
        <h2>${h.shopTitle}</h2>
      </a>
    </div>
    <div class="carousel" id="shopCarousel">
        ${kit.map((k, i) => html`<div class="slide${i === 0 ? ' active' : ''}"><img src="/assets/img/${k}.jpg" alt="${h.kitAlts[i + 1]}"></div>`)}
      <div class="dots">${kit.map((k, i) => html`<button class="${i === 0 ? 'active' : ''}" data-i="${i}" aria-label="${h.slide} ${i + 1}"></button>`)}</div>
    </div>
  </div>
</div></section>
${main ? html`<section class="sp-band"><div class="wrap">
  <div class="l"><span class="sp-eyebrow">${h.mainPartner}</span>${partnerLogo(main, 'lg')}</div>
  <div class="r"><p>${h.mainPartnerText}</p>
  <a href="#">${h.partnerWithUs} <i class="ti ti-arrow-up-right"></i></a></div>
</div></section>` : ''}
<section class="palm-sec section"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${h.honoursEyebrow}</span>${h.honoursTitle}</h2><a href="${u('/club')}#honours">${h.clubHistory} <i class="ti ti-arrow-right"></i></a></div>
  <div class="palm">
    ${[1, 11, 6, 1].map((n, i) => html`<div class="tr">${TROPHY}<div class="tr-b"><div class="big">${n}</div><div class="tl">${h.trophies[i]}</div></div></div>`)}
  </div>
</div></section>
<section class="section acad-sec"><div class="wrap">
  <div class="acad-head">
    <span class="eyebrow">${h.academyEyebrow}</span>${placements.academy ? html`<div class="sp-inline" style="margin:0 0 10px;justify-content:flex-start"><span class="pby">${h.academyPartner}</span>${partnerLogo(placements.academy)}</div>` : ''}
    <h2>${h.academyTitle}</h2>
    <p>${h.academyText}</p>
  </div>
  <div class="acad-grid">
    ${['U4', 'U10', 'U15'].map((g, i) => html`<div class="acad-cat"><div class="cat">${g}</div><div class="desc">${h.academyGroups[i]}</div></div>`)}
  </div>
</div></section>
<section class="section"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${h.exploreEyebrow}</span>${h.exploreTitle}</h2></div>
  <div class="more">
    ${cardImgs.map(([cls, href, img], i) => html`<a class="mcard ${cls}" href="${href}"><img class="pic" src="/assets/img/${img}.jpg" alt="${h.cards[i].alt}" loading="lazy"><div class="fg"></div><div class="mc-in"><h3>${h.cards[i].title}</h3><p>${h.cards[i].text}</p><span class="lk">${h.cards[i].link} <i class="ti ti-arrow-right"></i></span></div></a>`)}
  </div>
</div></section>`;
  return page({ t, title: '', css: ['site', 'sponsor', 'news-gfx'], active: 'home', path: '/', body, partners, description: h.sub });
}
