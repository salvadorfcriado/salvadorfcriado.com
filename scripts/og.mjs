#!/usr/bin/env node
/* Open Graph cards, 1200×630.

   Default:      one card per published post → public/img/og/<slug>.png
   With --default: also re-renders public/img/og-default.png (the site-wide card)

   Runs from the `prebuild` script, so `npm run build` can never ship a post whose
   card is missing or stale against its own title and tags. It fails loudly if it
   cannot render — a build that quietly falls back to the generic card is the exact
   bug this replaces, and the failure would only surface on LinkedIn, after the
   preview has already been cached against the URL.

   Fonts are inlined from src/styles/fonts.css rather than guessed from filenames:
   scripts/fonts.mjs content-hashes the woff2 files, so any hard-coded name goes
   stale the next time the fonts are refreshed. */

import { readFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = join(ROOT, 'src', 'content', 'blog');
const OUT_DIR = join(ROOT, 'public', 'img', 'og');
const DOMAIN = 'SALVADORFCRIADO.COM';

/* Puppeteer lives in the sibling CV project; this repo does not depend on it.
   If that ever stops being true, this is the line that says so. */
const PUPPETEER = '/home/salva/personal/cv/cv/node_modules/puppeteer';

const die = (msg) => { console.error(`og: ${msg}`); process.exit(1); };

/* ── Fonts ──────────────────────────────────────────────────────────────── */

function inlinedFontCss() {
  const cssPath = join(ROOT, 'src', 'styles', 'fonts.css');
  if (!existsSync(cssPath)) die(`missing ${cssPath} — run: node scripts/fonts.mjs`);

  return readFileSync(cssPath, 'utf8').replace(/url\("\/fonts\/([^"]+)"\)/g, (_, file) => {
    const p = join(ROOT, 'public', 'fonts', file);
    if (!existsSync(p)) die(`fonts.css references ${file}, which is not in public/fonts — run: node scripts/fonts.mjs`);
    return `url(data:font/woff2;base64,${readFileSync(p).toString('base64')})`;
  }).replace(/font-display:swap/g, 'font-display:block');   // never screenshot a fallback face
}

/* ── Frontmatter ────────────────────────────────────────────────────────── */

/* Deliberately small: this runs before astro build, so astro:content is not
   available. It understands exactly the shape src/content.config.ts allows. */
function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key] = kv;
    let value = kv[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      out[key] = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      continue;
    }
    value = value.replace(/^"([\s\S]*)"$/, '$1').replace(/^'([\s\S]*)'$/, '$1');
    if (value === 'true' || value === 'false') out[key] = value === 'true';
    else if (/^\d+$/.test(value)) out[key] = Number(value);
    else out[key] = value;
  }
  return out;
}

function tagLabels() {
  /* src/tags.ts is TypeScript; parse the labels out rather than adding a
     transpile step for seven strings. Slug and label are read as a pair, so a
     mismatch is impossible. */
  const src = readFileSync(join(ROOT, 'src', 'tags.ts'), 'utf8');
  const body = src.slice(src.indexOf('export const TAGS'));
  const map = new Map();
  for (const m of body.matchAll(/slug:\s*'([^']+)',\s*\n\s*label:\s*'([^']+)'/g)) map.set(m[1], m[2]);
  if (!map.size) die('could not read any tag labels out of src/tags.ts');
  return map;
}

/* ── Card ───────────────────────────────────────────────────────────────── */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Long titles must stay inside the frame. Step the display size down by length
   rather than scaling to fit, so cards of similar length look like a set. */
const titleSize = (t) =>
  t.length <= 42 ? 78 : t.length <= 60 ? 66 : t.length <= 85 ? 56 : t.length <= 115 ? 47 : 40;

const SHELL = (css, body, extra = '') => `<!doctype html><meta charset="utf-8"><style>
${css}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;
  padding:64px 76px;background:#fff;
  background-image:repeating-linear-gradient(to right,rgba(43,40,51,.045) 0 1px,transparent 1px 28px),
                   repeating-linear-gradient(to bottom,rgba(43,40,51,.045) 0 1px,transparent 1px 28px);
  border-bottom:10px solid #6d5ae6}
.eyebrow{font-family:"IBM Plex Mono";font-weight:500;font-size:19px;letter-spacing:.06em;color:#6d5ae6;
  text-transform:uppercase}
h1{font-family:"Space Grotesk";font-weight:700;line-height:1.04;letter-spacing:-.035em;color:#2b2833}
h1 span{color:#6d5ae6}
p{font-family:"IBM Plex Sans";font-size:24px;line-height:1.5;color:#65616f;max-width:820px}
.foot{font-family:"IBM Plex Mono";font-size:19px;letter-spacing:.04em;color:#65616f;
  display:flex;justify-content:space-between;align-items:baseline;gap:24px}
.foot .right{text-align:right;white-space:nowrap}
${extra}
</style>
${body}`;

const postCard = (css, { title, eyebrow, footRight }) => SHELL(css, `
<div class="eyebrow">[ ${esc(eyebrow)} ]</div>
<h1 style="font-size:${titleSize(title)}px">${esc(title)}</h1>
<div class="foot"><span>${DOMAIN}</span><span class="right">${esc(footRight)}</span></div>`);

const defaultCard = (css) => SHELL(css, `
<div class="eyebrow">[ AI &amp; PLATFORM ENGINEER ]</div>
<h1 style="font-size:104px;line-height:.98;letter-spacing:-.045em">Salvador<br><span>F. Criado</span></h1>
<p>LLM applications, agents and real-time voice — on a backbone of AWS, Terraform and Kubernetes.</p>
<div class="foot"><span>${DOMAIN}</span><span class="right">GRANADA, ES · REMOTE</span></div>`);

/* ── Run ────────────────────────────────────────────────────────────────── */

const require = createRequire(import.meta.url);
let puppeteer;
try {
  puppeteer = require(PUPPETEER);
} catch (err) {
  die(`puppeteer not found at ${PUPPETEER}\n    ` +
      `It is shared with the CV project — run \`npm install\` there, or point PUPPETEER in this script somewhere else.\n    ` +
      `(${err.message})`);
}

const css = inlinedFontCss();
const labels = tagLabels();

const posts = readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ slug: f.replace(/\.md$/, ''), data: frontmatter(readFileSync(join(POSTS_DIR, f), 'utf8')) }))
  .filter((p) => {
    if (!p.data) die(`${p.slug}.md has no frontmatter`);
    return !p.data.draft;
  });

if (!posts.length) die('no published posts found — refusing to wipe the card directory');

/* Rebuild from scratch: a card left behind by a renamed or unpublished post
   would keep resolving, and nothing would ever notice. */
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new' });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  const shoot = async (html, out) => {
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out });
  };

  for (const { slug, data } of posts) {
    if (!Array.isArray(data.tags) || !data.tags.length) die(`${slug}.md declares no tags`);
    const primary = data.tags[0];
    if (!labels.has(primary)) die(`${slug}.md: "${primary}" is not a tag in src/tags.ts`);

    const day = String(data.date).slice(0, 10);
    const mins = data.readingTime ? ` · ${data.readingTime} MIN READ` : '';
    await shoot(
      postCard(css, { title: data.title, eyebrow: labels.get(primary), footRight: `${day}${mins}` }),
      join(OUT_DIR, `${slug}.png`),
    );
    console.log(`og: ${slug}.png`);
  }

  if (process.argv.includes('--default')) {
    await shoot(defaultCard(css), join(ROOT, 'public', 'img', 'og-default.png'));
    console.log('og: og-default.png');
  }
} finally {
  await browser.close();
}

console.log(`og: ${posts.length} post card${posts.length === 1 ? '' : 's'} in public/img/og/`);
