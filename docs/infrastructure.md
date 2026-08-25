# Infrastructure

Everything below lives in the Cloudflare account that owns both zones.
Account `2e1fe9f33b6f7978e7db7068ff455dea`.

## Hosting

Cloudflare Pages project **`salvadorfcriado`** (`salvadorfcriado.pages.dev`), production
branch `main`, **direct upload** — not the dashboard GitHub integration.

Custom domains on the project: `salvadorfcriado.com`, `www.salvadorfcriado.com`.

### Deploying

```bash
npm run build
# 1. Fetch a short-lived upload token (account credentials required):
#    GET /accounts/{account_id}/pages/projects/salvadorfcriado/upload-token
CF_PAGES_UPLOAD_JWT="<jwt>" node scripts/pages-upload.mjs
#    (the token may still be passed as argv[1], but it then lands in shell
#     history and is visible in `ps` for the duration of the upload)
# 2. Create the deployment with the manifest the script writes into the system
#    temp directory — it prints the path:
#    POST /accounts/{account_id}/pages/projects/salvadorfcriado/deployments
#    multipart/form-data, fields: manifest, branch
```

`npm run build` runs `scripts/og.mjs` first (the `prebuild` hook), which regenerates one
1200×630 Open Graph card per published post into `public/img/og/`. Those cards are build
output and are git-ignored; they exist in `dist/` because the build put them there.

`scripts/pages-upload.mjs` hashes `dist/` the way wrangler does —
`blake3(base64(content) + extension)`, hex, first 32 characters — asks the API which
hashes are missing, uploads only those, and writes the manifest.

To deploy with `wrangler pages deploy dist` instead, create an API token with
**Cloudflare Pages: Edit** and export it as `CLOUDFLARE_API_TOKEN`. That is the shorter
path, and the one to wire into CI.

### Sharing an article — the order matters

LinkedIn fetches a URL's Open Graph data the **first** time that URL is pasted into the post
composer, and caches the result against the URL. Editing the post afterwards does not refresh
it, and neither does redeploying the site. Get the order wrong once and that article is stuck
with the wrong preview.

1. Deploy.
2. Open `https://salvadorfcriado.com/img/og/<slug>.png` and confirm the card is there.
3. Run the article URL through <https://www.linkedin.com/post-inspector/>. It refetches and
   shows exactly what will be rendered.
4. Only then compose the post.

For a URL that was already shared with the wrong card, step 3 is the fix — there is no other
way to invalidate it.

### Why not `_headers` and `_redirects`

Pages honours those files when it builds from a connected repository. Passing them as
form fields to the direct-upload deployment API does **not** work — the deployment
records zero `_`-prefixed files and the directives never take effect. Headers and
redirects are zone rules instead, listed below. Do not re-add the files: they would
look authoritative and do nothing.

## Zone `salvadorfcriado.com` (`541c638122a286fe74e420cd8fb206f2`)

| Record | Value | Proxied |
|---|---|---|
| `CNAME salvadorfcriado.com` | `salvadorfcriado.pages.dev` | yes |
| `CNAME www` | `salvadorfcriado.pages.dev` | yes |
| `MX` ×3 | `route{1,2,3}.mx.cloudflare.net` | — |
| `TXT` SPF + DKIM | Cloudflare Email Routing | — |

**Redirect rule** (`http_request_dynamic_redirect`): `http.host eq "www.salvadorfcriado.com"`
→ 301 to `concat("https://salvadorfcriado.com", http.request.uri.path)`, query preserved.
The apex is canonical; without this every page is reachable at two hosts.

**Redirect rule** — retired CV: `starts_with(http.request.uri.path, "/cv/")` → 301 to
`https://salvadorfcriado.com/`. The PDF was removed from the site, and the URL had been sent
out in applications and indexed; without the rule those links land on the 404 page.

**Response header rules** (`http_response_headers_transform`):

1. All responses — `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`,
   `Strict-Transport-Security: max-age=31536000; includeSubDomains`,
   `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`.
2. `/_astro/*` and `/fonts/*` — `Cache-Control: public, max-age=31536000, immutable`.
   Both are content-hashed, so a stale cache entry is impossible.
3. `starts_with(http.request.uri.path, "/img/")` — `Cache-Control: public, max-age=604800`.
   **Not** `immutable`: unlike the fonts, these filenames are not content-hashed. The
   portrait is the landing page's LCP resource and was falling through to the Pages
   default (`max-age=0, must-revalidate`), so it revalidated on every navigation.

**Content Security Policy.** The site ships zero executable JavaScript and contacts zero
third-party origins, so a near-maximal policy applies cleanly:

```
default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline';
img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'
```

`style-src 'unsafe-inline'` is required — Astro inlines every page's CSS into a `<style>`
block. The `application/ld+json` blocks are data, not script, and are unaffected by
`script-src 'none'`. **Stage this on a preview deployment and load every page before
promoting it**; a CSP that blocks the stylesheet renders an unstyled site to everyone.

## Zone `scdap.es` (`61bae31e491c1729b1add2e7e1d70776`)

No longer a site. `AAAA` at `100::` (the discard prefix) for the apex and `www`, both
proxied — the placeholder that gets traffic to the edge so the redirect rule can answer.
Nothing is ever fetched from an origin.

**Redirect rule** — *inverted 2026-08-25*. `scdap.es` now serves the consulting page
itself; it no longer points into the hiring domain.

The old rule sent the whole zone to `salvadorfcriado.com/services/`, which meant the
commercial surface lived on — and was indexed under — the domain whose only audience is
employers. A recruiter searching the brand name got the landing page *and* a consultancy
pitch quoting hourly rates and ES invoicing. That page has been deleted from this repo.

Two rules are needed:

1. On zone `salvadorfcriado.com`: `starts_with(http.request.uri.path, "/services")` → 301 to
   `https://scdap.es/`. Keeps every link already in the wild working, and keeps the
   commercial content off this domain's index.
2. On zone `scdap.es`: remove the blanket redirect and point the zone at wherever the
   consulting page is deployed.

Email routing on the zone is untouched and still delivers.
