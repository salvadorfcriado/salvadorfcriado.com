#!/usr/bin/env node
/**
 * Post-build integrity checks against `dist/`.
 *
 * Zero dependencies, plain Node. Exits non-zero on the first failing assertion
 * set, printing every offending path so a broken build is diagnosable from CI
 * logs alone.
 *
 *   1. Every internal href="/..." in dist/**\/*.html resolves to an emitted file.
 *   2. Every published post dir dist/blog/<slug>/ has dist/img/og/<slug>.png.
 *   3. dist/sitemap-0.xml and dist/llms.txt agree on the set of post URLs.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const failures = [];
function fail(assertion, lines) {
  failures.push({ assertion, lines });
}

/* ------------------------------------------------------------------ utils */

async function walk(dir, predicate, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, predicate, acc);
    else if (predicate(full)) acc.push(full);
  }
  return acc;
}

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function rel(p) {
  return path.relative(ROOT, p);
}

/* ------------------------------------------------- 1. internal href checks */

/**
 * Map a site-absolute URL path to the dist file(s) that would satisfy it.
 * Returns an array of acceptable candidates (any one existing = pass).
 */
function candidatesFor(urlPath) {
  const clean = urlPath.replace(/\/{2,}/g, '/');
  if (clean === '/') return [path.join(DIST, 'index.html')];
  const segments = clean.replace(/^\//, '').split('/');
  const last = segments[segments.length - 1];

  if (clean.endsWith('/')) {
    return [path.join(DIST, clean, 'index.html')];
  }
  if (last.includes('.')) {
    // Has a file extension — must exist verbatim.
    return [path.join(DIST, clean)];
  }
  // Extensionless, no trailing slash — accept either build format.
  return [path.join(DIST, clean, 'index.html'), path.join(DIST, `${clean}.html`)];
}

function shouldSkipHref(href) {
  if (!href) return true;
  if (href.startsWith('#')) return true;
  if (href.startsWith('//')) return true; // protocol-relative → external
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) return true; // mailto:, tel:, http:, data:
  if (!href.startsWith('/')) return true; // relative — not in scope
  return false;
}

async function checkHrefs(htmlFiles) {
  const broken = [];
  let checked = 0;

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const seen = new Set();
    for (const match of html.matchAll(/\bhref\s*=\s*"([^"]*)"/g)) {
      const raw = decodeEntities(match[1].trim());
      if (shouldSkipHref(raw)) continue;
      // Strip fragment and query.
      const urlPath = raw.split('#')[0].split('?')[0];
      if (!urlPath || !urlPath.startsWith('/')) continue;
      if (seen.has(urlPath)) continue;
      seen.add(urlPath);
      checked += 1;
      const candidates = candidatesFor(urlPath);
      if (!candidates.some(isFile)) {
        broken.push(`  ${rel(file)} → href="${urlPath}" (expected ${candidates.map(rel).join(' or ')})`);
      }
    }
  }

  if (broken.length) {
    fail('internal links', [
      `${broken.length} internal link(s) point at files that were not emitted:`,
      ...broken,
    ]);
    return null;
  }
  return `${checked} unique internal link(s) across ${htmlFiles.length} HTML file(s) all resolve.`;
}

/* -------------------------------------------------------- 2. OG card check */

async function listPostSlugs() {
  const blogDir = path.join(DIST, 'blog');
  let entries;
  try {
    entries = await readdir(blogDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const slugs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'tags') continue;
    if (!isFile(path.join(blogDir, entry.name, 'index.html'))) continue;
    slugs.push(entry.name);
  }
  return slugs.sort();
}

function checkOgCards(slugs) {
  if (slugs.length === 0) {
    fail('og cards', ['No published posts found under dist/blog/ — expected at least one.']);
    return null;
  }
  const missing = slugs.filter((slug) => !isFile(path.join(DIST, 'img', 'og', `${slug}.png`)));
  if (missing.length) {
    fail('og cards', [
      `${missing.length} post(s) have no OG card:`,
      ...missing.map((slug) => `  dist/blog/${slug}/ → missing dist/img/og/${slug}.png`),
    ]);
    return null;
  }
  return `${slugs.length} published post(s) each have a dist/img/og/<slug>.png card.`;
}

/* ------------------------------------------ 3. sitemap ↔ llms.txt agreement */

const POST_URL = /\/blog\/(?!tags\/)([a-z0-9][a-z0-9-]*)\//g;

function postSlugsIn(text) {
  const found = new Set();
  for (const match of text.matchAll(POST_URL)) found.add(match[1]);
  return found;
}

function diff(a, b) {
  return [...a].filter((x) => !b.has(x)).sort();
}

async function checkSitemapVsLlms() {
  const sitemapPath = path.join(DIST, 'sitemap-0.xml');
  const llmsPath = path.join(DIST, 'llms.txt');

  const missingFiles = [sitemapPath, llmsPath].filter((p) => !isFile(p));
  if (missingFiles.length) {
    fail('sitemap ↔ llms.txt', [
      'Required file(s) not emitted:',
      ...missingFiles.map((p) => `  ${rel(p)}`),
    ]);
    return null;
  }

  const sitemapSlugs = postSlugsIn(await readFile(sitemapPath, 'utf8'));
  const llmsSlugs = postSlugsIn(await readFile(llmsPath, 'utf8'));

  const onlySitemap = diff(sitemapSlugs, llmsSlugs);
  const onlyLlms = diff(llmsSlugs, sitemapSlugs);

  if (onlySitemap.length || onlyLlms.length) {
    const lines = ['dist/sitemap-0.xml and dist/llms.txt disagree on published posts:'];
    for (const slug of onlySitemap) lines.push(`  /blog/${slug}/ — in sitemap-0.xml, absent from llms.txt`);
    for (const slug of onlyLlms) lines.push(`  /blog/${slug}/ — in llms.txt, absent from sitemap-0.xml`);
    fail('sitemap ↔ llms.txt', lines);
    return null;
  }

  if (sitemapSlugs.size === 0) {
    fail('sitemap ↔ llms.txt', [
      'Neither dist/sitemap-0.xml nor dist/llms.txt reference any /blog/<slug>/ URL.',
    ]);
    return null;
  }

  return `sitemap-0.xml and llms.txt reference the same ${sitemapSlugs.size} post URL(s).`;
}

/* -------------------------------------------------------------------- main */

async function main() {
  try {
    const s = await stat(DIST);
    if (!s.isDirectory()) throw new Error('not a directory');
  } catch {
    console.error(`check-dist: ${rel(DIST)} does not exist — run \`npm run build\` first.`);
    process.exit(1);
  }

  const htmlFiles = (await walk(DIST, (p) => p.endsWith('.html'))).sort();
  if (htmlFiles.length === 0) {
    console.error(`check-dist: no HTML files found in ${rel(DIST)} — build looks empty.`);
    process.exit(1);
  }

  const results = [
    ['links   ', await checkHrefs(htmlFiles)],
    ['og      ', checkOgCards(await listPostSlugs())],
    ['manifest', await checkSitemapVsLlms()],
  ];

  for (const [label, summary] of results) {
    if (summary) console.log(`ok   ${label}  ${summary}`);
  }

  if (failures.length) {
    console.error('');
    for (const { assertion, lines } of failures) {
      console.error(`FAIL ${assertion}`);
      for (const line of lines) console.error(line);
      console.error('');
    }
    console.error(`check-dist: ${failures.length} assertion(s) failed.`);
    process.exit(1);
  }

  console.log('check-dist: all assertions passed.');
}

await main();
