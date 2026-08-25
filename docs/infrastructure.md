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
node scripts/pages-upload.mjs "<jwt>"
# 2. Create the deployment with the manifest written to /tmp/pages-deploy.json:
#    POST /accounts/{account_id}/pages/projects/salvadorfcriado/deployments
#    multipart/form-data, fields: manifest, branch
```

`scripts/pages-upload.mjs` hashes `dist/` the way wrangler does —
`blake3(base64(content) + extension)`, hex, first 32 characters — asks the API which
hashes are missing, uploads only those, and writes the manifest.

To deploy with `wrangler pages deploy dist` instead, create an API token with
**Cloudflare Pages: Edit** and export it as `CLOUDFLARE_API_TOKEN`. That is the shorter
path, and the one to wire into CI.

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

**Response header rules** (`http_response_headers_transform`):

1. All responses — `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`,
   `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
2. `/_astro/*` and `/fonts/*` — `Cache-Control: public, max-age=31536000, immutable`.
   Both are content-hashed, so a stale cache entry is impossible.

## Zone `scdap.es` (`61bae31e491c1729b1add2e7e1d70776`)

No longer a site. `AAAA` at `100::` (the discard prefix) for the apex and `www`, both
proxied — the placeholder that gets traffic to the edge so the redirect rule can answer.
Nothing is ever fetched from an origin.

**Redirect rule**: everything → `https://salvadorfcriado.com/services/`, 301.

Email routing on the zone is untouched and still delivers.
