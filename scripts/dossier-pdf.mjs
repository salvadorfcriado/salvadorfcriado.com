#!/usr/bin/env node
/* Renders /dossier/ and /es/dossier/ from the BUILT site into A4 PDFs:
     public/dossier/salvador-f-criado-dossier-{en,es}.pdf
   Run after `npm run build` whenever services, projects or about copy change:
     npm run build && npm run dossier && npm run build
   (the second build copies the fresh PDFs into dist/). The PDFs are committed:
   the Pages build does not run Chromium twice. */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer';

const DIST = 'dist';
const OUT = 'public/dossier';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };

if (!existsSync(DIST)) {
  console.error('dossier-pdf: dist/ missing — run `npm run build` first.');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  let p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  try {
    res.writeHead(200, { 'Content-Type': TYPES[extname(p)] ?? 'application/octet-stream' });
    res.end(await readFile(p));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch();
try {
  for (const [lang, path] of [['en', '/dossier/'], ['es', '/es/dossier/']]) {
    const page = await browser.newPage();
    await page.goto(base + path, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    const file = `${OUT}/salvador-f-criado-dossier-${lang}.pdf`;
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log(`dossier-pdf: wrote ${file}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
