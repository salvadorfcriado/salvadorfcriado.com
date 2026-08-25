## Why

A full audit of the deployed site was run on 2026-08-25 against the production build,
in Chrome, across six viewports, by six parallel reviewers (accessibility, responsive
layout and visual design, performance and runtime, SEO and metadata, content and
positioning, code quality). Every finding below was measured, not inferred.

The site is structurally sound — zero client-side JavaScript, no console errors, no
failed requests, no horizontal overflow at any viewport, valid JSON-LD on all 14 pages,
correct canonicals, correct per-post OG cards, exactly one `<h1>` per page, and body
text at 7.17:1 contrast. What the audit found is not a broken site. It is four
categories of defect that a hiring manager, a screen reader, a crawler, or a second
machine will each hit in turn:

1. **The site contradicts its own purpose.** `/services/` is a full commercial surface —
   SCDAP branding, `ProfessionalService` schema whose `provider` is the same `#person`
   node the hiring pages use, "Book a 30 min call — free", "Hourly, retainer or project",
   "ES invoicing" — and it is indexed, sitemapped and named in `llms.txt`. `CLAUDE.md`
   prohibits exactly this: no services CTA, no founder/company framing, audience is
   employers. A recruiter who searches the brand name gets the landing page *and* a
   consultancy pitch. Meanwhile nothing anywhere on the site says he is looking for a
   job, what kind, or on what terms — the whole page is proof with no ask.

2. **The legal name is published in machine-readable form on every page.**
   `Base.astro:53` emits `alternateName: "Salvador Francisco Criado Melero"` into the
   JSON-LD of all 14 pages, and `llms.txt` repeats it in prose. `alternateName` is the
   property Google uses to build Knowledge Graph aliases. `CLAUDE.md` is explicit that
   the legal name is never rendered on the web.

3. **Four claims on the site are not supported by `career/career.md`.** The Azure
   migration is written in the past tense with a completed zero-downtime cutover; it is
   in progress (career.md:145, "Marzo 2026 – Presente"). "Eight years owning distributed
   systems on AWS and Azure" against ~5 years of cloud focus and Azure from 2022.
   "100k+ users on my platforms", plural possessive, for one client-owned platform.
   "10,000 signals/sec" against a documented 1,000+. Each is the kind of line a hiring
   manager probes in the first ten minutes.

4. **Code blocks are invisible, and the build only runs on one laptop.** Shiki's default
   `github-dark` theme writes an inline `background-color:#24292e` on every `<pre>`,
   which beats the author rule; the override `color: var(--ink)` then paints dark text
   on it at **1.24:1**. Every code fence in every post is unreadable. Separately,
   `scripts/og.mjs:29` hard-codes `/home/salva/personal/cv/cv/node_modules/puppeteer`,
   so `npm run build` — the documented deploy command — fails at step zero on any other
   machine or CI runner, and the OG cards it produces are git-ignored.

## What Changes

Six workstreams. They are ordered by what breaks trust fastest, not by effort.

### A — Positioning and truthfulness (`hiring-positioning`)

- **`/services/` leaves this repo.** `src/pages/services.astro` is deleted and the
  consulting surface moves to `scdap.es`, which today 301s *into* this domain
  (`docs/infrastructure.md:91`) — that redirect is inverted, so `salvadorfcriado.com/services/*`
  → `https://scdap.es/` (301). Rationale and the rejected alternatives are in `design.md`.
- The legal name is deleted from `src/consts.ts`, from the Person JSON-LD, and from
  `llms.txt`. No consumer remains.
- Every unsupported claim is rewritten against `career/career.md`: the Azure migration
  is marked in progress, the stat strip drops the padded "3 clouds", "my platforms"
  becomes "a platform I migrated", and the eight-years lead separates total years from
  cloud years.
- A **"what I'm looking for"** block lands on the landing page and in the footer, and
  the hero's primary CTA becomes the email address rather than an off-site LinkedIn
  link in a new tab. `CONTACT` joins the top bar.
- A third selected-work row carries the real-time telemetry platform — 1,000+ industrial
  sensors, event-driven ingestion, critical-event alerting, team down from 20+ engineers
  to a handful and it kept running. This is the strongest employer-facing credential in
  `career.md` and it currently appears nowhere on the hiring surface, which is why the
  prose says "not AI-only" while every piece of evidence says AI-only.
- A compact `<dl>` in the About section restores the *experience data* the CV removal
  took with it — Now / Before / Education / Languages / Stack. **The PDF does not come
  back**; the archived decision (maintenance liability, per-offer CVs belong in
  `/generate-cv`) stands, and HTML is indexable where a PDF is not.
- Post footers gain a path back to hiring intent — email, work, next post — instead of
  the single off-site LinkedIn button.
- LinkedIn residue is removed from `temperature-zero-is-not-deterministic.md`: the
  literal `#LLMOps #AIGovernance #EUAIAct` line and the comment-bait ending that asks a
  blog with no comments for a response.

### B — Accessibility (`site-accessibility`)

- **Shiki is pinned to a light theme** and the `color: var(--ink)` override on `pre code`
  is dropped. This is the single worst defect found anywhere in the audit.
- A skip-to-content link, `<main id="main">`, and a real `:focus-visible` ring — the
  codebase currently has **zero** focus rules, so keyboard users fall back to a UA
  outline measured at 2.49:1, below the 3:1 minimum. Every `:hover` affordance in the
  codebase gains a `:focus-visible` twin.
- `<header>` landmark, `aria-label="Main"` on the top bar, `.status` moved out of the
  `<nav>`, `role="list"` on the ten marker-less flex/grid lists (Safari drops list
  semantics when `list-style: none` is set).
- Ordinal prefixes (`01 / `) move out of heading text so a heading-list read-out is not
  "zero one slash What I do". Card links stop swallowing the whole excerpt into their
  accessible name. `<br>` inside `<h1>` gets a space so the accessible name is not
  "SalvadorF. Criado". `target="_blank"` links announce that they open a new tab.
- Separator dots get `aria-hidden` and a compliant colour (measured 1.90:1).

### C — Responsive and visual system (`design-system`)

- **A 2-column step at 620–960px.** Every grid drops 3→1, so body copy runs at 107–135
  characters per line in that band. Plus `max-width: 68ch` on the paragraph classes and
  `72ch` on desktop excerpts (measured 94–96 cpl at 1440+).
- **The 48px alignment spine is repaired.** Above 1240px the top bar, stat strip and
  footer sit 48px right of every section, because they pad *inside* `.wrap` while
  sections pad outside.
- The `.ambient` panel is hidden below 960px, where it renders as a 720×240 empty
  bordered box above the footer. It is intentional decoration, not a missing image —
  but it does not read that way once it is full-width and empty.
- The cover title at `opacity: 0.22` (**1.60:1**) is either raised to a legible weight or
  removed; as shipped it duplicates the real title 30px below it and reads as a failed
  render.
- The portrait stops being upscaled 1.4–1.8× and cropped: the file is 512×512, the
  attributes claim 390×460, and at 768px it renders 720×420. Re-export at 780×920
  pre-cropped, add a `srcset`, fix the attributes.
- Tap targets reach 44px on mobile — currently *nothing* on any page does except `.btn`.
- The type scale collapses from 14 steps to 10; four clusters sit within 1–2px of each
  other (17/16.5/16, 14/13.5, 12/11/10.5/10). Missing tokens are added for the sizes
  used raw in four files (`40px` page-h1, `52px` masthead, `15px` body-lg, `0.04em`
  tracking). Three tokens defined and never used are deleted.
- Double hairline above the footer, section head collision below 400px, vertical rhythm
  that never responds, `<meta name="color-scheme">`, and a print stylesheet.

### D — Discoverability (`search-discoverability`)

- `BreadcrumbList` on posts, tag archives and `/blog/` — there is none anywhere today.
- The Person node gains `hasOccupation`, `seeks` (the schema property that says *this
  entity is looking for work*), `image`, `description`, `knowsLanguage` and the three
  certifications; the homepage gains `ProfilePage` with `mainEntity`. Full JSON-LD is in
  `design.md`.
- `noindex` prop on `Base.astro`, applied to `/404` (which currently self-canonicalises
  and is served for every unmatched path) and to the five single-post tag archives —
  7 of 13 sitemapped URLs are thin.
- RSS gains `atom:link rel="self"`, `lastBuildDate`, author, `ttl`, label categories
  instead of raw slugs, and a `/blog/` channel link.
- Sitemap gains `lastmod`; `robots.txt` states an explicit position on AI crawlers
  (allow — an LLM that has read this site can answer "who should I hire for LLM platform
  work in Spain"); `llms.txt` gets the `## Optional` section and unwrapped prose.
- The literal string "AI Engineer" appears on **zero** of 14 pages — every occurrence is
  "AI & Platform Engineer". The entity paragraph and the section headings absorb the
  query forms an employer actually types.
- `og:title` stops carrying the site-name suffix that `og:site_name` already provides
  and that LinkedIn truncates. Favicon variants, `apple-touch-icon`, web manifest,
  `theme-color`. Future-dated posts are corrected or gated behind `draft`.

### E — Performance (`site-performance`)

Measured: LCP 444ms throttled, CLS ≤0.035, 7–10 requests per page. Fonts are **84.3%**
of the landing page's 134 KB.

- IBM Plex Mono ships three static weight files (45 KB) because, unlike the two variable
  families, static instances do not dedup. Weight 500 is used by exactly one rule.
  Dropping to a single mono weight is **−30.5 KB, −23% of page weight**.
- `latin-ext` is subsetted, shipped (91 KB across 5 files) and **never requested** — all
  content is Latin-1. It is also 3.3 KB of the render-blocking CSS on every page.
- `inlineStylesheets: 'always'` — the landing page is the only page paying for a second
  blocking stylesheet, because its scoped CSS is 6.4 KB against Astro's 4 KB threshold.
- Font preload with `crossorigin` (fonts are currently discovered two round trips deep;
  the swap reflow lands ~177ms after FCP and is the sole source of all measured CLS).
- A third Cloudflare response-header rule for `/img/*` — the LCP resource currently
  revalidates on every navigation because only `/_astro/*` and `/fonts/*` are covered.
- `X-Content-Type-Options`, `Referrer-Policy`, and a strict CSP, which is nearly free on
  a site that ships zero executable JS and contacts zero third-party origins.

### F — Build integrity (`build-integrity`)

- **Puppeteer becomes a real devDependency.** The absolute path into `../cv/node_modules`
  makes the documented build command unreproducible anywhere but this laptop.
- **`tsconfig.json` is added.** Its absence is the root cause of 7 of 7 `astro check`
  errors and 17 of 21 hints — without it `.astro/types.d.ts` is never included and every
  `astro:content` entry degrades to `never`. Verified: adding it takes 7 errors → 4,
  21 hints → 4. The four survivors are real bugs and are fixed.
- **`openspec/` stops being git-ignored.** `.gitignore:6` currently makes the entire
  spec tree — 254 lines of requirements this codebase is written against — exist only on
  one disk. The pattern is also unanchored.
- `sharp` is removed: unused, and carrying two HIGH libvips advisories.
- CI: `npm ci && astro check && astro build` on push and PR, plus three assertions worth
  more than any unit test here — every `href` in `dist/` resolves, every published post
  has an OG card, and the sitemap and `llms.txt` agree on the post set.
- `og.mjs` validates all frontmatter *before* it wipes the output directory and launches
  Chromium, throws instead of `process.exit` inside the `try` (which currently orphans
  the browser and leaves fewer cards than it started with), guards long titles against
  silent clipping, and stops regex-scraping `src/tags.ts` — running Prettier over that
  file breaks the build today.
- Shared components extracted where the duplication is verbatim: `PostRow`,
  `SectionHead`, `WorkRow`, a `.graph-paper` utility (copy-pasted six times), one `.chip`
  base, `isoDay()`, `BLOG` constants, and title suffixing moved into `Base.astro`.

**Out of scope**, explicitly: the Astro 5→7 upgrade (two majors, end-of-line branch —
sequence it after CI exists, since CI is the only thing that will tell you whether the
migration landed); a Spanish-language surface, which is a real gap for local recruiters
but a separate decision; full-content RSS; and any change to `career/career.md` beyond
correcting the stray "10k events/s" at career.md:298 that contradicts career.md:196.

## Capabilities

### New Capabilities
- `hiring-positioning`: who the site addresses, what it may and may not claim, and what
  an employer must be able to learn without leaving it.
- `site-accessibility`: the conformance floor every page holds — contrast, keyboard
  operability, landmarks, and accessible names.
- `design-system`: the token vocabulary, the responsive steps, and the measure and rhythm
  rules that keep the layout legible between the breakpoints.
- `search-discoverability`: what crawlers, answer engines and social platforms can
  determine about this person from the markup alone.
- `site-performance`: the byte, request and stability budget each page ships under.
- `build-integrity`: the guarantee that a clean clone builds the same site on any machine.

### Modified Capabilities
- `social-preview`: adds tag-archive cards, an overflow guard on long titles, an
  `ogTitle` separate from the page title, and a build-time assertion that every published
  post has a card.

## Impact

**Code**

| File | Change |
|---|---|
| `src/pages/services.astro` | **deleted** — moves to `scdap.es` |
| `src/consts.ts` | drop `legalName`; add `BLOG`, `SITE.status`; widen `ENTITY_PARAGRAPH` |
| `src/layouts/Base.astro` | drop `alternateName`; add `noindex`, `ogTitle`, `titleSuffix`; `<header>`; skip link; font preloads; Person schema rewrite |
| `src/pages/index.astro` | CTA order, availability block, third work row, experience `<dl>`, stat rewrites, heading ordinals, `.ambient` breakpoint, portrait `srcset` |
| `src/pages/blog/[...slug].astro` | Shiki fix, related posts, hiring footer, `BreadcrumbList`, `ENTITY_PARAGRAPH` import |
| `src/pages/blog/index.astro`, `blog/tags/[tag].astro` | `PostRow` extraction, `noindex` on thin archives, breadcrumbs |
| `src/pages/404.astro` | `noindex`, copy, contact line |
| `src/components/*` | `TopBar` (header/landmark/contact/`SITE` usage), `Footer` (status line, measure), `Cover` (title opacity, thumb breakpoint), new `PostRow`/`SectionHead`/`WorkRow` |
| `src/styles/global.css` | `:focus-visible`, `.graph-paper`, `.chip`, `.rows`/`.row`, `.cta`, `.alt`, type-scale tokens, print block, dead tokens removed |
| `src/pages/rss.xml.js`, `llms.txt.ts` | feed metadata; legal name and `/services/` links removed |
| `astro.config.mjs` | Shiki theme, `trailingSlash`, sitemap `filter` + `lastmod`, `inlineStylesheets: 'always'` |
| `scripts/og.mjs` | real Puppeteer import, pre-validation, throw-not-exit, title guard, tag import |
| `scripts/fonts.mjs` | drop mono 500/600, drop `latin-ext`, emit preload filenames |
| `tsconfig.json`, `.github/workflows/ci.yml`, `.github/dependabot.yml` | new |
| `.gitignore` | un-ignore `openspec/`; add `.env*`; decide on `.claude/` |
| `package.json` | remove `sharp`; add `puppeteer`, `@astrojs/check`, `typescript` as devDependencies; `check` script; `engines` |

**Assets**: `public/img/portrait.webp` re-exported at 780×920; favicon variants,
`apple-touch-icon.png`, `site.webmanifest` added; `og-default.png` moved to generated
output; all OG cards run through `oxipng`.

**Infrastructure**: the `scdap.es` zone rule is inverted; one new response-header rule
for `/img/*`; two headers added to the existing rule; a CSP staged on a preview
deployment before promotion.

**Risk**: deleting `/services/` costs whatever inbound value that URL currently carries —
which the audit measured as approximately zero, since nothing in `dist/` links to it and
it is reachable only via sitemap, `llms.txt` and the `scdap.es` redirect. The 301 keeps
every existing link working. The larger risk is the reverse: leaving it costs the brand
query, which is the entire reason to own the domain.
