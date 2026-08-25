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

There are two paths, and they produce the same thing: a Markdown file in
`src/content/blog/` that the build validates. Neither is privileged — a generated post
and a hand-written one are indistinguishable by frontmatter shape and render through
the same template.

**By hand.** Drop the file in. Fully supported, documented below, and the fastest route
for a short piece.

**Through the pipeline.** `agent/` is a staged, gated pipeline that drafts a post and
its LinkedIn package, enforces the publishing rules as executable gates rather than
prose, stops for approval three times, and opens a pull request. It ends at handoff:
nothing posts to LinkedIn. See [`agent/README.md`](agent/README.md) — it is Python, it
is inert to `npm run build`, and deleting it changes nothing about the site.

### By hand

Drop a Markdown file into `src/content/blog/`. Frontmatter:

```yaml
---
title: "Post title"
date: 2026-08-25
tags: [rag, search-retrieval]   # 1–3, from src/tags.ts. First one is primary.
readingTime: 9                  # minutes
excerpt: "Two sentences that also serve as the meta description."
cover: /img/whatever.png        # optional — overrides the generated OG card
draft: false                    # optional
---
```

The landing page's WRITING section, `/blog`, the tag archives, `rss.xml`, `sitemap.xml`
and `llms.txt` all pick it up at build time. Covers on-page are typographic and generated
in CSS — no image needed.

### Tags

`src/tags.ts` is the whole vocabulary: slug, display label, and the one-sentence blurb that
becomes the archive page's meta description. The content schema derives its enum from it, so
a tag that is not in that file **fails the build** rather than producing an orphan page.

A post declares 1–3 tags. The first is primary — it is what the cover renders and what the
social card prints, so order it deliberately.

Every tag carried by at least one published post gets a prerendered archive at
`/blog/tags/<slug>/`. Tags with no posts get no page and no chip.

To use a tag that is not active yet, move it out of the reserve list at the top of
`src/tags.ts` into `TAGS` with a label and a blurb — at the moment a post needs it, not in
advance. Renaming an active slug breaks its archive URL and needs a redirect rule.

### Social previews

`npm run build` regenerates one 1200×630 Open Graph card per published post into
`public/img/og/<slug>.png` (git-ignored — it is build output). Post pages point `og:image`
at their own card, declare `og:type: article`, and carry the image dimensions so unfurlers
pick the large-card layout.

`npm run og` additionally re-renders the site-wide `public/img/og-default.png`.

**LinkedIn caches a URL's preview on first fetch.** Deploy before you paste a link anywhere —
the order is in `docs/infrastructure.md`.

## Layout

| Path | What |
|---|---|
| `src/pages/index.astro` | Landing — hero, stats, what I do, selected work, writing, about |
| `src/pages/blog/` | Blog index, post template, and `tags/[tag]` archives |
| `src/pages/services.astro` | SCDAP consulting surface. Deliberately out of the main nav |
| `src/styles/global.css` | Design tokens, ported from the design-system bundle |
| `src/consts.ts` | Identity, links, and the GEO entity paragraph |
| `src/tags.ts` | Tag vocabulary — labels, blurbs, and the reserve list |
| `scripts/og.mjs` | Open Graph cards: one per post, plus `--default` for the site card |
| `docs/design/` | Design handoff — the implementation source of truth |

## Design

Approved design is option `3a` of the handoff in `docs/design/`. One accent colour
(violet `#6d5ae6`), three typefaces (Space Grotesk / IBM Plex Sans / IBM Plex Mono),
self-hosted WOFF2. Do not introduce a second strong colour or a fourth family.

## Deploy

Cloudflare Pages, project `salvadorfcriado`. Build command `npm run build`, output `dist/`.
