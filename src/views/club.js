import { html } from '../lib/html.js';
import { page } from './layout.js';

const HONOURS = [
  ['1', ['2003/04']],
  ['11', ['1990/91', '1993/94', '1996/97', '2003/04', '2004/05', '2007/08', '2010/11', '2015/16', '2016/17', '2017/18', '2024/25']],
  ['6', ['2015/16', '2016/17', '2017/18', '2018/19', '2021/22', '2024/25']],
  ['1', ['jan2005']],
];

export function clubPage({ t, partners }) {
  const c = t.club;
  const body = html`
<section class="art-hero club-hero">
  <div class="bg"><img src="/assets/img/club-celebration.jpg" alt="${c.heroAlt}" style="object-position:center 42%"></div>
  <div class="veil"></div>
  <div class="wrap"><div class="inner">
    <span class="tag">${c.tag}</span>
    <h1>${c.title}</h1>
    <div class="sub-meta">${c.meta.map((m, i) => html`${i ? html`<span class="dot"></span>` : ''}<span>${m}</span>`)}</div>
  </div></div>
</section>

<section class="section" style="padding-top:0"><div class="wrap">
  <div class="facts">
    ${c.facts.map(([k, v]) => html`<div class="fact"><span class="k">${k}</span><div class="v">${v}</div></div>`)}
  </div>
</div></section>

<section class="section band-white" style="padding:100px 0"><div class="wrap">
  <div class="article art-2col"><div class="art-main">
    <p class="lead">${c.lead}</p>
    <p>${c.p1}</p>

    <h2>${c.h2a}</h2>
    <p>${c.p2}</p>
    <p>${c.p3}</p>
    <p>${c.p4}</p>


    <h2>${c.h2b}</h2>
    <p>${c.p5}</p>

    <h2>${c.h2c}</h2>
    <p>${c.p6}</p>
    <p>${c.p7}</p></div>
    <aside class="art-aside"><div class="pull">${c.pull}</div></aside>
  </div>
</div></section>

<div class="era-band"><div class="wrap">
  <blockquote>${c.quoteA}<b>${c.quoteB}</b></blockquote>
  <cite>${c.cite}</cite>
</div></div>

<section class="section"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${c.journeyEyebrow}</span>${c.journeyTitle}</h2></div>
  <div class="tl-wrap">
    ${c.timeline.map(([y, h, p]) => html`<div class="tl-item"><div class="y">${y}</div><h3>${h}</h3><p>${p}</p></div>`)}
  </div>
</div></section>

<section class="section band-white" style="padding:100px 0" id="honours"><div class="wrap">
  <div class="sec-h"><h2><span class="sec-eyebrow">${c.honoursEyebrow}</span>${c.honoursTitle}</h2></div>
  <div class="hon-grid">
    ${HONOURS.map(([n, years], i) => html`<div class="hon"><div class="n">${n}</div><div class="t">${c.honours[i]}</div>
      <div class="years">${years.map((y) => html`<span>${y === 'jan2005' ? c.jan2005 : y}</span>`)}</div></div>`)}
  </div>
</div></section>
`;
  return page({ t, title: c.title, css: ['site', 'article', 'sponsor', 'club'], active: 'club', path: '/club', body, partners, description: c.lead });
}
