/* Pages Direct Upload — hashes dist/, uploads what's missing, prints the manifest.
   Usage: CF_PAGES_UPLOAD_JWT=<jwt> node scripts/pages-upload.mjs
   Hash algorithm matches wrangler: blake3(base64(content) + extension), hex, first 32 chars. */
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';

/* Prefer the environment. An argv token is echoed into shell history and is
   readable by any other user on the box via `ps` for the whole upload — which,
   for a multi-megabyte dist/, is not a short window. argv stays as a fallback
   so existing invocations keep working. */
const JWT = process.env.CF_PAGES_UPLOAD_JWT || process.argv[2];
if (!JWT) {
  console.error('usage: CF_PAGES_UPLOAD_JWT=<jwt> node scripts/pages-upload.mjs   (or: pages-upload.mjs <jwt>)');
  process.exit(1);
}
if (!process.env.CF_PAGES_UPLOAD_JWT) {
  console.warn('pages-upload: token passed on the command line — prefer CF_PAGES_UPLOAD_JWT');
}

const DIST = 'dist';
const API = 'https://api.cloudflare.com/client/v4';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf',
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const files = walk(DIST).map((p) => {
  const buf = readFileSync(p);
  const b64 = buf.toString('base64');
  const ext = extname(p);
  const hash = bytesToHex(blake3(new TextEncoder().encode(b64 + ext.substring(1)))).slice(0, 32);
  const rel = '/' + relative(DIST, p).split(sep).join('/');
  return { path: rel, hash, b64, contentType: MIME[ext] ?? 'application/octet-stream', size: buf.length };
});

/* _headers / _redirects are deployment config, not assets. */
const assets = files.filter((f) => !['/_headers', '/_redirects', '/_routes.json'].includes(f.path));

console.log(`${assets.length} assets, ${(assets.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(2)} MB`);

const call = async (path, body) => {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${JWT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.success) throw new Error(`${path} failed: ${JSON.stringify(j.errors)}`);
  return j;
};

const { result: missing } = await call('/pages/assets/check-missing', {
  hashes: assets.map((f) => f.hash),
});
console.log(`${missing.length} missing, uploading`);

const toUpload = assets.filter((f) => missing.includes(f.hash));
/* Batch by payload size — the endpoint rejects oversized bodies. */
const MAX_BATCH_BYTES = 20 * 1024 * 1024;
let batch = [], batchBytes = 0, n = 0;
const flush = async () => {
  if (!batch.length) return;
  await call('/pages/assets/upload', batch);
  n += batch.length;
  console.log(`  uploaded ${n}/${toUpload.length}`);
  batch = []; batchBytes = 0;
};
for (const f of toUpload) {
  if (batchBytes + f.b64.length > MAX_BATCH_BYTES) await flush();
  batch.push({ key: f.hash, value: f.b64, base64: true, metadata: { contentType: f.contentType } });
  batchBytes += f.b64.length;
}
await flush();

await call('/pages/assets/upsert-hashes', { hashes: assets.map((f) => f.hash) });

const manifest = Object.fromEntries(assets.map((f) => [f.path, f.hash]));
/* _headers and _redirects are deployment config, sent as their own form fields. */
const config = Object.fromEntries(
  files
    .filter((f) => ['/_headers', '/_redirects'].includes(f.path))
    .map((f) => [f.path.slice(1), Buffer.from(f.b64, 'base64').toString('utf8')])
);
const payloadPath = join(tmpdir(), 'pages-deploy.json');
writeFileSync(payloadPath, JSON.stringify({ manifest, ...config }));
console.log(`deploy payload written to ${payloadPath}: ${Object.keys(manifest).length} assets, config: ${Object.keys(config).join(', ') || 'none'}`);
