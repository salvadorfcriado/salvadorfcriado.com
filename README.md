# salvadorfcriado.com

Personal site for Salvador F. Criado — AI & Platform Engineer. Astro, static output,
no client-side JavaScript, deployed on Cloudflare Pages.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # static output in dist/
```

## Publishing a post

Drop a Markdown file into `src/content/blog/`. Frontmatter:

```yaml
---
title: "Post title"
date: 2026-08-25
tag: rag        # rag | voice | stacks | infra
readingTime: 9  # minutes
excerpt: "Two sentences that also serve as the meta description."
draft: false    # optional
---
```

The landing page's WRITING section, `/blog`, `rss.xml`, `sitemap.xml` and `llms.txt`
all pick it up at build time. Covers are typographic and generated in CSS — no image needed.

## Layout

| Path | What |
|---|---|
| `src/pages/index.astro` | Landing — hero, stats, what I do, selected work, writing, about |
| `src/pages/blog/` | Blog index and post template |
| `src/pages/services.astro` | SCDAP consulting surface. Deliberately out of the main nav |
| `src/styles/global.css` | Design tokens, ported from the design-system bundle |
| `src/consts.ts` | Identity, links, and the GEO entity paragraph |
| `scripts/og.cjs` | Regenerates the default Open Graph image |
| `docs/design/` | Design handoff — the implementation source of truth |

## Design

Approved design is option `3a` of the handoff in `docs/design/`. One accent colour
(violet `#6d5ae6`), three typefaces (Space Grotesk / IBM Plex Sans / IBM Plex Mono),
self-hosted WOFF2. Do not introduce a second strong colour or a fourth family.

## Deploy

Cloudflare Pages, project `salvadorfcriado`. Build command `npm run build`, output `dist/`.
