#!/usr/bin/env node
/* Open Graph cards, 1200×630.

   Default:        one card per published post → public/img/og/<slug>.png
                   one card per in-use tag     → public/img/og/tags/<slug>.png
   With --default: also re-renders public/img/og-default.png (the site-wide card)
   With --force:   ignores the manifest and re-renders everything

   Runs from the `prebuild` script, so `npm run build` can never ship a post whose
   card is missing or stale against its own title and tags. It fails loudly if it
   cannot render — a build that quietly falls back to the generic card is the exact
   bug this replaces, and the failure would only surface on LinkedIn, after the
   preview has already been cached against the URL.

   Fonts are inlined from src/styles/fonts.css rather than guessed from filenames:
   scripts/fonts.mjs content-hashes the woff2 files, so any hard-coded name goes
   stale the next time the fonts are refreshed.

   ── Order of operations ──────────────────────────────────────────────────────
   1. Parse and VALIDATE every post. Nothing is written and no browser starts
      until the whole corpus is known good. An earlier version validated inside
      the render loop, after wiping the output directory — a typo in the newest
      post's tags therefore deleted the cards of every post that came before it.
   2. Diff against public/img/og/.manifest.json and decide what to render.
   3. Launch Chromium only if that set is non-empty.

   ── Frontmatter contract ─────────────────────────────────────────────────────
   This parser runs BEFORE `astro build`, so `astro:content` (and its YAML
   parser) is not available. It is deliberately small and supports exactly the
   subset that src/content.config.ts allows:

     • Single-line scalars:            title: "..."   date: 2026-08-27
       Quotes are optional; a matching leading/trailing pair is stripped.
     • Inline flow sequences ONLY:     tags: [rag, evaluation]
       Items may be quoted or bare.
     • Booleans and integers are coerced: draft: true, readingTime: 9

   NOT supported, and each produces a named validation error rather than a
   silently empty value:

     • Block sequences        tags:
                                - rag
     • Literal/folded scalars excerpt: >
                                 wrapped text
     • Nested mappings, anchors, multi-document streams.

   If a post ever legitimately needs one of those, the fix is to teach this
   parser, not to work around it — a silently empty title ships a blank card. */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

/* src/tags.ts is imported, not scraped.
   It used to be regex-parsed out of the file's source text, which required a
   specific quote style and required `slug:` and `label:` to sit on adjacent
   lines — so running Prettier over tags.ts broke the build, for reasons that
   pointed nowhere near tags.ts.

   Node 24 strips TypeScript types from `.ts` imports natively (on by default
   since 22.18 — no --experimental-strip-types flag, which matters because
   `prebuild` is invoked by npm with no argv control). tags.ts is entirely
   erasable syntax: interfaces, `as const satisfies`, type aliases. There is no
   codegen step to keep in sync, and the tag vocabulary is now literally the
   same object the site renders from.

   The constraint this buys: tags.ts must stay erasable — no `enum`, no
   `namespace`, no constructor parameter properties. Any of those throws
   ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX here, loudly, at prebuild. */
import { TAGS, tagLabel, tagBlurb, sortByVocabulary } from '../src/tags.ts';

import { CARD, CANVAS } from './tokens.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const POSTS_DIR = join(ROOT, 'src', 'content', 'blog');
const OUT_DIR = join(ROOT, 'public', 'img', 'og');
const TAG_OUT_DIR = join(OUT_DIR, 'tags');
const MANIFEST = join(OUT_DIR, '.manifest.json');
const DOMAIN = 'SALVADORFCRIADO.COM';

const TITLE_MAX = 150;   // beyond this the card clips — see the h1 line-clamp

const FORCE = process.argv.includes('--force');
const WANT_DEFAULT = process.argv.includes('--default');

/* ── Fonts ──────────────────────────────────────────────────────────────── */

function inlinedFontCss() {
  const cssPath = join(ROOT, 'src', 'styles', 'fonts.css');
  if (!existsSync(cssPath)) throw new Error(`missing ${cssPath} — run: node scripts/fonts.mjs`);

  return readFileSync(cssPath, 'utf8').replace(/url\("\/fonts\/([^"]+)"\)/g, (_, file) => {
    const p = join(ROOT, 'public', 'fonts', file);
    if (!existsSync(p)) {
      throw new Error(`fonts.css references ${file}, which is not in public/fonts — run: node scripts/fonts.mjs`);
    }
    return `url(data:font/woff2;base64,${readFileSync(p).toString('base64')})`;
  }).replace(/font-display:swap/g, 'font-display:block');   // never screenshot a fallback face
}

/* ── Frontmatter ────────────────────────────────────────────────────────── */

/* A YAML block-scalar header: `|`, `>`, and their chomping/indent variants. */
const BLOCK_SCALAR = /^[|>][+-]?\d*$/;

function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;                       // indented continuation, comment, blank
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

/* ── Validation ─────────────────────────────────────────────────────────── */

/* Every post is checked before anything is written or deleted. Problems are
   collected rather than thrown one at a time: fixing five posts should take one
   build, not five. */
function validatePosts(posts, vocabulary) {
  const problems = [];

  for (const { file, data } of posts) {
    const bad = (msg) => problems.push(`  ${file}: ${msg}`);

    /* Unsupported YAML shapes present as a missing or sentinel value. Name the
       shape instead of reporting the symptom — see the contract at the top. */
    const shapeOf = (v) => {
      if (v === undefined) return 'is missing (or uses a block sequence / nested mapping, which this parser does not support — use an inline form)';
      if (typeof v === 'string' && BLOCK_SCALAR.test(v)) return `uses a "${v}" block scalar, which this parser does not support — put it on one line`;
      if (typeof v === 'string' && v === '') return 'is empty (or is a block sequence — this parser supports inline flow sequences only, e.g. tags: [rag, evaluation])';
      return null;
    };

    for (const key of ['title', 'date', 'excerpt']) {
      const problem = shapeOf(data[key]);
      if (problem) bad(`\`${key}\` ${problem}`);
    }

    if (typeof data.title === 'string' && data.title.length > TITLE_MAX) {
      bad(`title is ${data.title.length} characters; the card clips past ~${TITLE_MAX}. Shorten it or give the post a shorter card title.`);
    }

    const tagProblem = shapeOf(data.tags);
    if (tagProblem) {
      bad(`\`tags\` ${tagProblem}`);
    } else if (!Array.isArray(data.tags)) {
      bad(`\`tags\` is a ${typeof data.tags}, not a list — write it inline: tags: [rag, evaluation]`);
    } else if (!data.tags.length) {
      bad('declares no tags; the primary tag is what the card prints as its eyebrow');
    } else {
      for (const t of data.tags) {
        if (!vocabulary.has(t)) {
          bad(`"${t}" is not a tag in src/tags.ts (known: ${[...vocabulary].join(', ')})`);
        }
      }
    }
  }

  if (problems.length) {
    throw new Error(`${problems.length} frontmatter problem${problems.length === 1 ? '' : 's'} — nothing was rendered or deleted:\n${problems.join('\n')}`);
  }
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
body{width:${CANVAS.width}px;height:${CANVAS.height}px;display:flex;flex-direction:column;justify-content:space-between;
  padding:${CARD.padding};background:${CARD.bg};
  background-image:repeating-linear-gradient(to right,${CARD.gridLine} 0 1px,transparent 1px ${CARD.gridCell}),
                   repeating-linear-gradient(to bottom,${CARD.gridLine} 0 1px,transparent 1px ${CARD.gridCell});
  border-bottom:${CARD.rule} solid ${CARD.accent}}
.eyebrow{font-family:"IBM Plex Mono";font-weight:500;font-size:19px;letter-spacing:${CARD.trackingLabel};color:${CARD.accent};
  text-transform:uppercase}
/* The line clamp is a backstop, not the layout: titles are validated against
   TITLE_MAX so this should never actually engage. If it does, a clipped card is
   still better than one with its footer pushed off the canvas. */
h1{font-family:"Space Grotesk";font-weight:700;line-height:1.04;letter-spacing:${CARD.trackingTitle};color:${CARD.ink};
  overflow:hidden;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical}
h1 span{color:${CARD.accent}}
p{font-family:"IBM Plex Sans";font-size:24px;line-height:1.5;color:${CARD.muted};max-width:820px}
.foot{font-family:"IBM Plex Mono";font-size:19px;letter-spacing:${CARD.trackingMeta};color:${CARD.muted};
  display:flex;justify-content:space-between;align-items:baseline;gap:24px}
.foot .right{text-align:right;white-space:nowrap}
${extra}
</style>
${body}`;

const postCard = (css, { title, eyebrow, footRight }) => SHELL(css, `
<div class="eyebrow">[ ${esc(eyebrow)} ]</div>
<h1 style="font-size:${titleSize(title)}px">${esc(title)}</h1>
<div class="foot"><span>${DOMAIN}</span><span class="right">${esc(footRight)}</span></div>`);

/* Tag archives reuse the post template verbatim: same frame, same rule, same
   type ramp. The label takes the title slot and the blurb the supporting line,
   so a tag card reads as part of the same set rather than as a second design. */
const tagCard = (css, { label, blurb, footRight }) => SHELL(css, `
<div class="eyebrow">[ FIELD NOTES ]</div>
<h1 style="font-size:${titleSize(label)}px">${esc(label)}</h1>
<p>${esc(blurb)}</p>
<div class="foot"><span>${DOMAIN}</span><span class="right">${esc(footRight)}</span></div>`);

const defaultCard = (css) => SHELL(css, `
<div class="eyebrow">[ AI &amp; PLATFORM ENGINEER ]</div>
<h1 style="font-size:104px;line-height:.98;letter-spacing:${CARD.trackingDisplay}">Salvador<br><span>F. Criado</span></h1>
<p>LLM applications, agents and real-time voice — on a backbone of AWS, Terraform and Kubernetes.</p>
<div class="foot"><span>${DOMAIN}</span><span class="right">GRANADA, ES · REMOTE</span></div>`);

/* ── Manifest ───────────────────────────────────────────────────────────── */

/* Cards are pure functions of their inputs, so a digest of those inputs decides
   whether one needs re-rendering. Included: everything the card prints, the
   inlined font CSS (a font refresh changes every card), and the mtimes of this
   script and its token file (a template or palette edit changes every card).

   Not a content hash of the PNG: the point is to avoid launching Chromium at
   all, which means deciding before anything is rendered. */
const digest = (parts) => createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32);

function readManifest() {
  if (FORCE || !existsSync(MANIFEST)) return { posts: {}, tags: {} };
  try {
    const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    return { posts: m.posts ?? {}, tags: m.tags ?? {} };
  } catch {
    /* A corrupt manifest costs one full re-render, which is recoverable.
       Trusting it would ship stale cards, which is not. */
    console.warn('og: .manifest.json is unreadable — re-rendering everything');
    return { posts: {}, tags: {} };
  }
}

/* Targeted deletion, never a wholesale rmSync of OUT_DIR: the manifest lives in
   there, and wiping it would make every build a full rebuild — which is how the
   incremental path silently stops being incremental. */
function pruneStale(dir, keep) {
  if (!existsSync(dir)) return [];
  const removed = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.png')) continue;
    if (keep.has(name.replace(/\.png$/, ''))) continue;
    rmSync(join(dir, name), { force: true });
    removed.push(name);
  }
  return removed;
}

/* ── Run ────────────────────────────────────────────────────────────────── */

async function main() {
  const css = inlinedFontCss();
  const vocabulary = new Set(TAGS.map((t) => t.slug));

  /* Template identity: any edit to the card markup or the palette invalidates
      every digest. mtime is coarse but never misses a real edit. */
  const templateStamp = [
    statSync(fileURLToPath(import.meta.url)).mtimeMs,
    statSync(join(HERE, 'tokens.mjs')).mtimeMs,
  ];

  /* ── 1. Parse and validate. Nothing is written until this passes. ─────── */

  if (!existsSync(POSTS_DIR)) throw new Error(`no post directory at ${POSTS_DIR}`);

  const all = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({ slug: f.replace(/\.md$/, ''), file: f, data: frontmatter(readFileSync(join(POSTS_DIR, f), 'utf8')) }));

  const headless = all.filter((p) => !p.data);
  if (headless.length) {
    throw new Error(`no frontmatter block in: ${headless.map((p) => p.file).join(', ')}`);
  }

  const posts = all.filter((p) => !p.data.draft);
  if (!posts.length) throw new Error('no published posts found — refusing to prune the card directory');

  validatePosts(posts, vocabulary);

  const tagsInUse = sortByVocabulary([...new Set(posts.flatMap((p) => p.data.tags))]);

  /* ── 2. Diff against the manifest. ───────────────────────────────────── */

  const previous = readManifest();
  const next = { posts: {}, tags: {} };
  const jobs = [];

  for (const { slug, data } of posts) {
    const primary = data.tags[0];
    const day = String(data.date).slice(0, 10);
    const mins = data.readingTime ? ` · ${data.readingTime} MIN READ` : '';
    const card = { title: data.title, eyebrow: tagLabel(primary), footRight: `${day}${mins}` };

    const d = digest([card, primary, css, templateStamp]);
    next.posts[slug] = d;

    const out = join(OUT_DIR, `${slug}.png`);
    if (previous.posts[slug] === d && existsSync(out)) continue;
    jobs.push({ kind: 'post', slug, out, html: () => postCard(css, card), label: `${slug}.png` });
  }

  for (const slug of tagsInUse) {
    const count = posts.filter((p) => p.data.tags.includes(slug)).length;
    const card = {
      label: tagLabel(slug),
      blurb: tagBlurb(slug),
      footRight: `${count} POST${count === 1 ? '' : 'S'}`,
    };

    const d = digest([card, css, templateStamp]);
    next.tags[slug] = d;

    const out = join(TAG_OUT_DIR, `${slug}.png`);
    if (previous.tags[slug] === d && existsSync(out)) continue;
    jobs.push({ kind: 'tag', slug, out, html: () => tagCard(css, card), label: `tags/${slug}.png` });
  }

  if (WANT_DEFAULT) {
    /* Explicitly asked for, so always re-rendered — it is not in the manifest
       and it lives outside OUT_DIR. */
    jobs.push({
      kind: 'default',
      slug: 'og-default',
      out: join(ROOT, 'public', 'img', 'og-default.png'),
      html: () => defaultCard(css),
      label: 'og-default.png',
    });
  }

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TAG_OUT_DIR, { recursive: true });

  const dropped = [
    ...pruneStale(OUT_DIR, new Set(posts.map((p) => p.slug))),
    ...pruneStale(TAG_OUT_DIR, new Set(tagsInUse)).map((n) => `tags/${n}`),
  ];
  for (const name of dropped) console.log(`og: removed ${name} (no longer published)`);

  /* ── 3. Render, only if there is something to render. ─────────────────── */

  if (!jobs.length) {
    writeFileSync(MANIFEST, JSON.stringify(next, null, 2));
    console.log(`og: up to date — ${posts.length} post card${posts.length === 1 ? '' : 's'}, ${tagsInUse.length} tag card${tagsInUse.length === 1 ? '' : 's'}, nothing to render`);
    return;
  }

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: CANVAS.width, height: CANVAS.height, deviceScaleFactor: 1 });

    for (const job of jobs) {
      /* Throw, never process.exit: exiting here skips the `finally` below and
         orphans the Chromium process for the rest of the session. */
      await page.setContent(job.html(), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: job.out });
      console.log(`og: ${job.label}`);
    }
  } finally {
    await browser.close();
  }

  /* Written last: a manifest that claims a card exists when the render died
     halfway would make the next build skip it. */
  writeFileSync(MANIFEST, JSON.stringify(next, null, 2));

  const rendered = jobs.filter((j) => j.kind !== 'default').length;
  const skipped = posts.length + tagsInUse.length - rendered;
  console.log(
    `og: ${posts.length} post card${posts.length === 1 ? '' : 's'} + ${tagsInUse.length} tag card${tagsInUse.length === 1 ? '' : 's'} in public/img/og/ ` +
    `(${rendered} rendered, ${skipped} unchanged)`,
  );
}

try {
  await main();
} catch (err) {
  console.error(`og: ${err.message}`);
  process.exitCode = 1;
}
