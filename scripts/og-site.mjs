#!/usr/bin/env node
/* Site-wide share cards (1200×630), one per language:
     public/img/og-es.png · public/img/og-en.png
   Used by every page that has no card of its own (blog posts keep the
   per-post cards from scripts/og.mjs). Re-run when the positioning changes:
     node scripts/og-site.mjs */
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';

const font = (f) => `url(data:font/woff2;base64,${readFileSync(`public/fonts/${f}`).toString('base64')})`;
const css = readFileSync('src/styles/fonts.css', 'utf8').match(/url\("\/fonts\/([^"]+)"\)/g)
  .map((m) => m.match(/\/fonts\/([^"]+)/)[1]);
const display = css.find((f) => f.startsWith('intertight'));
const sans = css.find((f) => f.startsWith('inter-'));

const CARDS = {
  es: {
    kicker: 'Especialista en IA aplicada',
    title: 'IA aplicada y software a medida para empresas',
    sub: 'Agentes de voz y de texto · documentos · automatización · cloud',
    stats: [['−80 %', 'horas administrativas'], ['90 %', 'contabilidad automatizada'], ['< 2 s', 'agente de voz']],
  },
  en: {
    kicker: 'Applied AI specialist',
    title: 'Applied AI and custom software for businesses',
    sub: 'Voice and text agents · documents · automation · cloud',
    stats: [['−80%', 'admin hours'], ['90%', 'bookkeeping automated'], ['< 2 s', 'voice agent']],
  },
};

const html = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:D;src:${font(display)};font-weight:100 900}
@font-face{font-family:S;src:${font(sans)};font-weight:100 900}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:S;color:rgba(236,234,255,.72);
background:radial-gradient(60% 70% at 100% 0%,rgba(139,123,255,.6),transparent 70%),radial-gradient(50% 60% at 0% 100%,rgba(111,227,255,.16),transparent 70%),#0c0b19;
padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between;position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px);background-size:48px 48px;-webkit-mask-image:radial-gradient(ellipse 70% 70% at 75% 20%,#000 20%,transparent 80%)}
.top,.main,.bottom{position:relative}
.top{display:flex;align-items:center;gap:16px;color:#fff;font-family:D;font-weight:650;font-size:28px}
.mark{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#8b7bff,#6d5ae6 55%,#4b3bc4);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px}
.k{font-size:20px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#b4a8ff}
h1{margin-top:14px;font-family:D;font-weight:700;font-size:64px;line-height:1.02;letter-spacing:-.04em;color:#fff;max-width:960px}
.sub{margin-top:16px;font-size:24px}
.bottom{display:flex;align-items:flex-end;justify-content:space-between}
.stats{display:flex;gap:14px}
.s{padding:14px 20px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05)}
.n{font-family:D;font-weight:700;font-size:34px;letter-spacing:-.04em;line-height:1;background:linear-gradient(100deg,#e0daff,#9d8dff 55%,#6fe3ff);-webkit-background-clip:text;color:transparent}
.l{margin-top:4px;font-size:15px}
.url{font-size:20px;color:#fff;font-weight:500}
</style></head><body><div class="grid"></div>
<div class="top"><div class="mark">SC</div>Salvador F. Criado</div>
<div class="main"><p class="k">${c.kicker}</p><h1>${c.title}</h1><p class="sub">${c.sub}</p></div>
<div class="bottom"><div class="stats">${c.stats.map(([n, l]) => `<div class="s"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div><div class="url">salvadorfcriado.com</div></div>
</body></html>`;

const b = await puppeteer.launch();
for (const [lang, c] of Object.entries(CARDS)) {
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 630 });
  await p.setContent(html(c), { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `public/img/og-${lang}.png` });
  console.log(`og-site: wrote public/img/og-${lang}.png`);
}
await b.close();
