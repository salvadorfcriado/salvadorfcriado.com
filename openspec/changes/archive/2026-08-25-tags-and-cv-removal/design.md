## Context

Astro 5 static site, three published posts, deployed to Cloudflare Pages by direct upload.
Content is a `glob` collection over `src/content/blog/*.md` with a Zod schema. There is no
client-side JavaScript on the site today and no framework integration — every page is
prerendered HTML plus one stylesheet.

Current state relevant to this change:

- `content.config.ts` declares `tag: z.enum(['rag','voice','stacks','infra'])`. The value is
  rendered in three places (`Cover.astro`, the list-row meta line, the post header) and
  linked from none.
- `Base.astro` accepts `ogImage` with a default of `/img/og-default.png` and hard-codes
  `og:type: website` for every page including articles.
- `scripts/og.cjs` already solves the hard part of card rendering: it inlines the brand
  woff2 files as base64 so Puppeteer renders with the real typefaces instead of a fallback,
  and it encodes the palette. It renders exactly one card.
- `SITE.cv` points at a PDF served from `public/cv/`.

The constraint that shapes most of the decisions below: **the site ships no JavaScript, and
the whole point of the site is to be indexable** — by classic search and by generative
engines. Anything that only exists after hydration is invisible to both.

## Goals / Non-Goals

**Goals:**

- A reader can go from any post to every other post on the same topic in one click.
- Each topic has a stable, indexable URL that a search or generative engine can cite.
- A tag typo is a build error, not a silently orphaned archive page.
- A link to any article, pasted into LinkedIn, unfurls with a card specific to that article.
- The site stops shipping a CV, without leaving dead links behind.

**Non-Goals:**

- Multi-dimensional filtering (tag + date, tag intersection). One tag at a time.
- Tag pages with pagination. At three posts and a realistic ceiling of a few dozen, a
  single page per tag is correct; revisit past ~30 posts in one tag.
- A hand-designed image per post. The generated card is the floor, not the ceiling; the
  `cover` escape hatch is there for when a post deserves better.
- Automated LinkedIn publishing. That needs an OAuth app with `w_member_social` and is a
  project, not a build step.
- Any change to the landing page beyond deleting the CV button.

## Decisions

### 1. `tags` is an array of 1–3 values, first is primary

**Chosen:** `tags: z.array(z.enum(TAG_SLUGS)).min(1).max(3)`, `tags[0]` treated as primary.

A single tag cannot describe a post that is genuinely about retrieval *and* evaluation, and
the three existing posts each sit at an intersection. Unbounded tags produce archive pages
with no editorial meaning, so the cap of three is a real constraint, not decoration.

Designating `tags[0]` as primary avoids a second frontmatter field. It is what `Cover.astro`
renders, what the OG card prints, and what leads the RSS category list. Ordering carries
meaning, so the migration has to choose it deliberately rather than alphabetise.

**Alternatives considered:** a separate `category` (primary) plus `tags` (secondary) — two
concepts to keep straight for no gain at this size; free-form strings — cheap to write, and
guaranteed to produce `rag`, `RAG` and `retrieval` within a year, with no build-time signal.

### 2. Vocabulary lives in `src/tags.ts`, and the schema imports it

The enum and the human-readable labels must come from one place, or a tag renders as a raw
slug on one page and a label on another. `src/tags.ts` exports an ordered array of
`{ slug, label, blurb }`, plus a derived `TAG_SLUGS` tuple for Zod and a `tagLabel()` lookup.

`blurb` is one sentence per tag, used as the `<meta name="description">` and the intro line
on that tag's archive page. Without it, every tag page carries a templated description and
they compete with each other in search results.

**Active vocabulary** — seven tags, each earned by at least one existing post:

| slug | label |
|---|---|
| `rag` | RAG |
| `search-retrieval` | Search & Retrieval |
| `evaluation` | Evaluation & Monitoring |
| `llm-serving` | LLM Serving |
| `llmops` | LLMOps |
| `data-engineering` | Data Engineering |
| `governance` | Regulation & Governance |

**Reserve** — kept as a commented list in the same file, not in the enum, so adding one is a
deliberate two-line edit: `agents`, `voice-multimodal`, `embeddings`, `vector-databases`,
`fine-tuning`, `prompt-engineering`, `quantization`, `architecture`, `cloud-platform`,
`kubernetes`, `distributed-systems`, `ai-coding`, `cost-performance`.

**Promotion rule**, recorded in the file: a reserve tag joins the active enum when a post
that needs it is actually being written — not in advance. The failure mode this avoids is a
vocabulary of thirty tags across eight posts, where every archive page has one entry and the
filter row is longer than the post list.

### 3. Tag archives are prerendered pages at `/blog/tags/<slug>/`

`getStaticPaths` derives the path list from the published posts, not from the vocabulary, so
a tag with no posts produces no page and no chip. Nothing links to a thin or empty archive.

**Alternatives considered:** client-side filtering on `/blog/` with chips toggling `hidden`.
Cheaper to build, one URL, instant. But it produces nothing for a crawler to index, breaks
without JavaScript, and cannot be linked to or cited — which defeats the reason for having
topics at all on a site whose stated goal is search and generative-engine visibility.

The chips on `/blog/` are plain `<a>` elements. The current tag's chip on an archive page is
marked `aria-current="page"` and styled as active, and each archive page carries a
"← All posts" affordance back to `/blog/`.

### 4. Per-post OG cards are generated at build time from the post's own metadata

`scripts/og-posts.mjs` reads the collection's markdown frontmatter directly (a small
frontmatter parse, not an Astro import — the script runs before `astro build`), and for each
non-draft post renders `public/img/og/<slug>.png` at 1200×630 using the same font-inlining
and palette as `scripts/og.cjs`. The card prints the primary tag as an eyebrow, the title as
the display face, and the domain plus date as a footer.

`package.json` gains `"prebuild": "node scripts/og-posts.mjs"` so `npm run build` cannot
produce a `dist/` whose cards are stale relative to its posts. A missing Puppeteer aborts the
build with a clear message rather than shipping articles that all point at the default card.

Resolution order in `[...slug].astro`: `data.cover` if set, else `/img/og/<slug>.png`. The
`cover` field already exists in the schema and has never been used; this gives it a purpose
and a clean upgrade path when a post gets a real illustration.

**Alternatives considered:** `astro-og-canvas` or Satori — adds a dependency and a second
font pipeline to a project that already has a working Puppeteer renderer with the brand faces
solved; rendering on demand at the edge — the site is static, and an image that 404s on first
crawl is cached as a 404 by the platform doing the crawling.

### 5. Article pages declare `og:type: article` and size their image

`Base.astro` gains `ogType` (default `website`) and an optional `article` prop carrying
`publishedTime`, `modifiedTime` and `tags`. Article pages emit `article:published_time`,
`article:modified_time` and one `article:tag` per tag.

Three details that decide whether the unfurl is a large card or a thumbnail, and are trivial
to get wrong:

- `og:image` must be an **absolute** URL. `Base.astro` already resolves it through `new URL()`
  against `SITE.url`, so this holds — but it must keep holding for the generated path.
- `og:image:width` and `og:image:height` are emitted explicitly. Without them a crawler has to
  fetch and decode the image before it knows the aspect ratio, and some renderers fall back to
  the small-thumbnail layout rather than wait.
- `og:image:alt` is set from the post title.

### 6. Publish order is part of the design, not an afterthought

LinkedIn fetches a URL's Open Graph data the first time that URL appears in a post composer
and **caches the result against the URL**. Composing a post before the article is deployed —
or before its card exists — caches the wrong card, and editing the post afterwards does not
refresh it. The recorded order is: build and deploy → confirm the card resolves at its
absolute URL → run the URL through LinkedIn Post Inspector → only then compose the post.

This goes in `docs/infrastructure.md`, next to the deploy procedure, because that is where
someone will be standing when it matters.

### 7. `/cv/*` is redirected, not deleted into a 404

A CV URL has been handed out in applications and is in crawler indexes. Deleting the file
turns those into 404s. A 301 to `/` at the zone level costs one rule and matches how `www`
and the retired `scdap.es` zone are already handled — this project's redirects live in
Cloudflare rules, never in `_redirects`, which the direct-upload path silently ignores
(documented in `docs/infrastructure.md`).

## Risks / Trade-offs

**Previously-shared article URLs keep the generic card** → LinkedIn's cache is per URL and
survives this change. Mitigation: after deploy, run all three existing post URLs through Post
Inspector. This is a listed task, not a hope.

**Puppeteer is reached by absolute path into a sibling project** (`../cv/node_modules`) →
inherited from `scripts/og.cjs`. It breaks if this repo is cloned alone. Mitigation: the
script fails with an explicit message naming the expected path, and `prebuild` failing stops
the build — the bad outcome is a loud failure, never a silently generic card. Making it a
real dependency of this project is a reasonable follow-up, not part of this change.

**Generated cards are text-only** → they will not win an attention contest against a
hand-made illustration. Trade-off accepted: a per-post card that is on-brand and correct
beats one generic card for forty posts, and `cover` is the escape hatch.

**Vocabulary churn** → renaming an active tag later breaks its archive URL. Mitigation: the
seven active tags are each backed by existing posts, and the promotion rule keeps speculative
tags out of the enum. If a rename becomes necessary, it needs a redirect rule, same as `/cv/*`.

**Build time grows with post count** → one Puppeteer page render per post, in a single browser
instance. Three posts is seconds. At fifty it is worth caching by content hash; not now.

## Migration Plan

1. `src/tags.ts` lands first — nothing else compiles against the new vocabulary until it exists.
2. Schema flips to `tags`; the three posts are migrated in the same commit. A build between
   those two steps fails, so they are not separable.
3. Consumers (`Cover`, blog index, post page, `index.astro`, `rss.xml`, `llms.txt`) updated to
   read `tags`; archive route added.
4. OG script, `Base.astro` props, `prebuild` wiring.
5. CV removal across code and assets.
6. `npm run build`, verify the generated HTML: absolute `og:image` per post, one archive page
   per active tag, no `/cv/` reference anywhere in `dist/`.
7. Deploy. Add the `/cv/*` redirect rule. Refresh the three post URLs in Post Inspector.

**Rollback:** the change is a single commit on a static site; `git revert` plus a redeploy of
the previous `dist/` restores the prior state. The only non-reverting piece is the Cloudflare
redirect rule, which is harmless if the CV returns (it would need deleting, and that is a
one-click operation).

## Open Questions

- Whether `/blog/tags/` itself should exist as an index of all tags, or whether the chips on
  `/blog/` are sufficient. Building it now is speculative; the chip row is the same
  information. Deferred — revisit when the vocabulary outgrows one row.
- Whether the RSS feed should carry every tag as a `<category>` or only the primary. Decided:
  every tag. Readers filter on categories, and there is no downside to being specific.
