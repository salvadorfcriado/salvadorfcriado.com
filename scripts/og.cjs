#!/usr/bin/env node
/* Renders public/img/og-default.png (1200×630) with the masthead typography.
   Run after fonts change: node scripts/og.js */
const puppeteer = require('/home/salva/personal/cv/cv/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const FONTS = path.join(__dirname, '..', 'public', 'fonts');
const face = (family, weight, stem) => {
  const b64 = fs.readFileSync(path.join(FONTS, `${stem}-latin.woff2`)).toString('base64');
  return `@font-face{font-family:"${family}";font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
};

const css = [
  face('Space Grotesk', 700, 'spacegrotesk-700'),
  face('IBM Plex Mono', 500, 'plexmono-500'),
  face('IBM Plex Sans', 400, 'plexsans-400'),
].join('\n');

const html = `<!doctype html><meta charset="utf-8"><style>
${css}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;
  padding:72px 80px;background:#fff;
  background-image:repeating-linear-gradient(to right,rgba(43,40,51,.045) 0 1px,transparent 1px 28px),
                   repeating-linear-gradient(to bottom,rgba(43,40,51,.045) 0 1px,transparent 1px 28px);
  border-bottom:10px solid #6d5ae6}
.eyebrow{font-family:"IBM Plex Mono";font-weight:500;font-size:19px;letter-spacing:.06em;color:#6d5ae6}
h1{font-family:"Space Grotesk";font-weight:700;font-size:104px;line-height:.98;letter-spacing:-.045em;color:#2b2833}
h1 span{color:#6d5ae6}
p{font-family:"IBM Plex Sans";font-size:24px;line-height:1.5;color:#65616f;max-width:820px}
.foot{font-family:"IBM Plex Mono";font-size:19px;letter-spacing:.04em;color:#65616f;
  display:flex;justify-content:space-between;align-items:baseline}
</style>
<div class="eyebrow">[ AI &amp; PLATFORM ENGINEER ]</div>
<h1>Salvador<br><span>F. Criado</span></h1>
<p>LLM applications, agents and real-time voice — on a backbone of AWS, Terraform and Kubernetes.</p>
<div class="foot"><span>SALVADORFCRIADO.COM</span><span>GRANADA, ES · REMOTE</span></div>`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(__dirname, '..', 'public', 'img', 'og-default.png') });
  await browser.close();
  console.log('og-default.png written');
})();
