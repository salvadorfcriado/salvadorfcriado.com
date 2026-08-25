## Why

Three problems, one change, because they touch the same files:

1. **The blog has no browsable structure.** Every post carries exactly one `tag` from a
   four-value enum (`rag | voice | stacks | infra`) that is displayed but never linked.
   A reader who wants "everything about retrieval" has no way to get it, and the site
   publishes no topical hub pages for search or generative engines to anchor on.
2. **Every article shares the same social preview.** `Base.astro` defaults `og:image` to
   `/img/og-default.png` and the post page never overrides it, so a link to any article
   on LinkedIn renders the same generic card with the site masthead. LinkedIn caches the
   preview per URL on first fetch, so this is not a cosmetic issue — a wrong card is a
   card that stays wrong.
3. **The CV is a maintenance liability.** The PDF has to be regenerated and redeployed
   every time the career file moves, and the site's focus is the blog plus a short
   introduction, not a résumé mirror.

## What Changes

**Tags**

- **BREAKING (content schema)**: `tag: z.enum([...])` becomes `tags: z.array(z.enum([...])).min(1).max(3)`.
  Every existing post's frontmatter is migrated. `tags[0]` is the primary tag — the one
  rendered on covers and list rows, the one used for the OG card and the RSS primary category.
- New closed vocabulary of **7 active tags**, defined once in `src/tags.ts` and imported by
  the content schema so the enum and the display labels cannot drift apart. A documented
  **reserve list** of not-yet-active tags lives in the same file as comments, with the rule
  for promoting one.
- New static tag pages at `/blog/tags/<slug>/`, one per tag that has at least one published
  post, each listing that tag's posts newest-first.
- Filter chips on `/blog/` linking to the tag pages, and clickable tag chips on each post.
  No client-side JavaScript.
- `rss.xml`, `llms.txt`, sitemap and the `BlogPosting` JSON-LD `keywords` all carry the full
  tag list instead of the single value.

**Per-post OG images**

- New build step `scripts/og-posts.mjs` renders one 1200×630 card per published post into
  `public/img/og/<slug>.png`, reusing the brand typography and palette already encoded in
  `scripts/og.cjs`.
- `[...slug].astro` passes that image (or the post's `cover` frontmatter field, when set —
  the field exists in the schema today and is unused) to `Base.astro`.
- `Base.astro` gains an `ogType` prop so article pages emit `og:type: article` with
  `article:published_time` and `article:tag`, instead of the current hard-coded `website`.
- Documented publishing order in `docs/infrastructure.md`: deploy first, then LinkedIn Post
  Inspector, then post — because of the cache-on-first-fetch behaviour.

**CV removal**

- `SITE.cv` deleted from `src/consts.ts`; the `CV (PDF)` button removed from the hero;
  the CV line removed from `llms.txt`; `public/cv/salvador-criado-cv.pdf` deleted.
- A redirect rule sends `/cv/*` to `/` with a 301 so any link already in the wild — a
  previously-sent application, a crawler's index — does not land on the 404 page.

**Out of scope** (explicitly, so it is not silently assumed): the content-generation skill,
any reshaping of the landing page beyond removing the CV button, and retiring
`/linkedin-piece`. Those are separate decisions.

## Capabilities

### New Capabilities
- `blog-taxonomy`: the tag vocabulary, how posts declare tags, and the tag archive pages
  and filter affordances that let a reader browse by topic.
- `social-preview`: what a URL from this site renders as when it is unfurled by a social
  platform — per-post images, Open Graph typing, and the publish ordering that makes the
  first fetch the correct one.

### Modified Capabilities
_None — `openspec/specs/` is empty; this is the first change in the project._

## Impact

**Code**

| File | Change |
|---|---|
| `src/tags.ts` | new — vocabulary, labels, ordering, reserve list |
| `src/content.config.ts` | `tag` → `tags`, enum sourced from `src/tags.ts` |
| `src/content/blog/*.md` (×3) | frontmatter migration |
| `src/pages/blog/index.astro` | filter chips, tag list in row meta |
| `src/pages/blog/[...slug].astro` | tag chips, OG image, `og:type`, JSON-LD keywords |
| `src/pages/blog/tags/[tag].astro` | new — static tag archive |
| `src/pages/index.astro` | remove CV button; tags in the writing section |
| `src/components/Cover.astro` | takes primary tag |
| `src/layouts/Base.astro` | `ogType` + article meta props |
| `src/pages/rss.xml.js` | all tags as categories |
| `src/pages/llms.txt.ts` | tag list; drop the CV line |
| `src/consts.ts` | drop `SITE.cv` |
| `scripts/og-posts.mjs` | new — per-post card renderer |
| `package.json` | `build` runs the OG step before `astro build` |

**Assets**: `public/cv/salvador-criado-cv.pdf` deleted; `public/img/og/*.png` added
(generated, git-ignored, produced at build time).

**Dependencies**: `puppeteer` is used by `scripts/og.cjs` through an absolute path into
`../cv/node_modules`. The new script inherits that arrangement rather than adding a
dependency to this project; the OG step must fail loudly, not silently skip, if it is absent.

**Infrastructure**: one new Cloudflare redirect rule for `/cv/*`. Deploy is Pages direct
upload as documented in `docs/infrastructure.md`.

**Risk**: LinkedIn's per-URL preview cache. Any article shared before this ships keeps the
generic card until it is refreshed through Post Inspector. Three posts exist; all three
should be refreshed after deploy.
