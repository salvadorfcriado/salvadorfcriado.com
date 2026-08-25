Ordered by dependency, then by severity. Phases 1–3 are the ones worth shipping this week;
phases 4–8 are the rest of the audit, in the order that makes each next phase cheaper.

## 0. Make the build verifiable before changing anything

- [x] 0.1 Add `tsconfig.json`: `{"extends":"astro/tsconfigs/strict","include":[".astro/types.d.ts","**/*"],"exclude":["dist"]}` — verified to take `astro check` from 7 errors / 21 hints to 4 / 4
- [x] 0.2 `npm i -D @astrojs/check typescript`; add `"check": "astro check"` to scripts
- [x] 0.3 `npm i -D puppeteer`; replace the absolute path at `scripts/og.mjs:29` with a real import — this is what makes the documented build command work off this laptop
- [x] 0.4 `npm rm sharp` — unused, and carrying two HIGH libvips advisories
- [x] 0.5 Add `"engines": {"node": ">=20"}` and `.nvmrc`
- [x] 0.6 Delete `openspec` from `.gitignore:6` and `git add openspec/`; add `.env`/`.env.*`; decide whether `.claude/` is tracked or ignored (it is currently neither)
- [x] 0.7 Fix the four surviving `astro check` errors: extract `isoDay(d: Date)` into `src/lib/format.ts` and import it in `index.astro:13`, `blog/index.astro:11`, `tags/[tag].astro:26`; type the `sortByVocabulary` argument so `TagSlug[].includes(string)` narrows
- [x] 0.8 Add `.github/workflows/ci.yml` — `npm ci && npm run check && npm run build` on push and PR
- [x] 0.9 Add three CI assertions against `dist/`: every internal `href` resolves to an emitted file; every published post has `img/og/<slug>.png`; `sitemap-0.xml` and `llms.txt` list the same post URLs
- [x] 0.10 Add `.github/dependabot.yml`, npm ecosystem, monthly

## 1. Stop publishing what should not be published

- [x] 1.1 Delete `alternateName: SITE.legalName` from `src/layouts/Base.astro:51` and `legalName` from `src/consts.ts:5`
- [x] 1.2 Remove the legal-name parenthetical from `src/pages/llms.txt.ts:18`
- [x] 1.3 Verify: `grep -ri "melero" dist/` returns nothing after a rebuild
- [x] 1.4 Delete `src/pages/services.astro`
- [x] 1.5 Remove the `/services/` line from `src/pages/llms.txt.ts:30`
- [x] 1.6 Invert the Cloudflare zone rule in `docs/infrastructure.md:91`: `scdap.es` serves the consulting page; `salvadorfcriado.com/services/*` → `https://scdap.es/` (301)
- [ ] 1.7 Move the consulting content to the `scdap.es` deploy target, correcting the two claims that fail `career.md` on the way (10,000 signals/sec → 1,000+, per career.md:196; the invented `2023—25` range; the merged Iyris/TMC project) — **not done here**: needs the `scdap.es` deploy target, which is outside this repo. The page was deleted; the content is in git history at `5924801:src/pages/services.astro`.
- [ ] 1.8 Raise with the user: `career.md:298` carries a stray "10k events/s" that contradicts `career.md:196`. Do not edit `career.md` without explicit confirmation. — **open question for Salvador**, see the deviations section.

## 2. Fix the claims on the landing page

- [x] 2.1 `index.astro:35-38` — Azure migration to present tense, `y: '2026 — now'`, cutover described as planned, not completed
- [x] 2.2 `index.astro:63-66` — separate total years from cloud years; name the event-driven / telemetry / Terraform base in the lead
- [x] 2.3 `index.astro:18` — `users on my platforms` → `users on a platform i migrated`
- [ ] 2.4 `index.astro:19` — drop the padded `3 / clouds: aws · azure · on-prem`; on-prem is not a cloud — **not done, by decision**: Salvador asked to keep the stat strip as an image of range rather than a strict count.
- [x] 2.5 `index.astro:22-26` — rewrite the three capability columns out of second-person buyer register ("your data", "quality you can measure") and out of the repeated em-dash-benefit cadence; fix "expert Terraform"
- [x] 2.6 Add the third selected-work row: real-time telemetry, 1,000+ sensors, event-driven ingestion, critical-event alerting, and the "20+ engineers down to a handful" detail (career.md:179, :184, :196)

## 3. Fix what is unreadable or unreachable

- [x] 3.1 `astro.config.mjs` — `markdown: { shikiConfig: { theme: 'github-light' } }`; drop `color: var(--ink)` at `blog/[...slug].astro:115`. Verify a code fence measures ≥ 4.5:1 (currently 1.24:1)
- [x] 3.2 `src/styles/global.css` — add `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`; the codebase currently has zero focus rules
- [x] 3.3 Add `:focus-visible` to every hover rule: `index.astro:255`, `blog/index.astro:92`, `global.css:90`, `global.css:105`, `global.css:107`, `TopBar.astro:33`, `Footer.astro:37`, `TagChips.astro:46`
- [x] 3.4 `Base.astro` — skip link as first child of `<body>`, `<main id="main" tabindex="-1">`, wrap `TopBar` in `<header>`
- [x] 3.5 `TopBar.astro:5` — `aria-label="Main"`; move `.status` out of the `<nav>`, keep it in the `<header>`
- [x] 3.6 `TopBar.astro:11,13` — `aria-hidden="true"` on the separator dots and a compliant colour (currently 1.90:1)
- [x] 3.7 `role="list"` on the ten marker-less lists: `TagChips.astro:29`, `index.astro:243`, `blog/index.astro:86`, `tags/[tag].astro`
- [x] 3.8 Move ordinals out of heading text — `index.astro:92,106,165` — following the pattern `index.astro:125` already uses correctly
- [x] 3.9 Give card links a short accessible name: `index.astro:132-140`, `index.astro:144-153`, `blog/index.astro:52-62`, `tags/[tag].astro`
- [x] 3.10 Add a space before `<br />` in `index.astro:62` so the name is not "SalvadorF. Criado"
- [x] 3.11 Add a visually-hidden "(opens in a new tab)" to every `target="_blank"`: `index.astro:68,106,174`, `[...slug].astro:65`, `Footer.astro:11,12`; add `noreferrer` where no `me` relationship is asserted

## 4. Make the site ask for the job

- [x] 4.1 `index.astro:67-71` — email becomes the primary CTA, LinkedIn the secondary; availability note carries remote scope, timezone and "open to permanent senior / staff roles"
- [x] 4.2 Add `CONTACT` to the `TopBar` anchor set
- [x] 4.3 Add a "what I'm looking for" block to the About section — contract type, seniority band, hands-on vs leadership, EU work authorisation (career.md:315-320)
- [x] 4.4 Add `SITE.status` to `consts.ts` and render it in `Footer.astro`, so it appears on every post
- [x] 4.5 Add the experience `<dl>` to section 04 — Now / Before / Education (career.md:255-258) / Languages (career.md:22) / Stack. HTML, not a PDF; the archived removal decision stands
- [x] 4.6 Rewrite the post footer (`[...slug].astro:65-74`): email, route to the work, route to another post; import `ENTITY_PARAGRAPH` instead of the hand-retyped copy at `:70-71`
- [x] 4.7 Delete `src/content/blog/temperature-zero-is-not-deterministic.md:180` (the hashtag line) and `:174-180` (the comment prompt); end the post at `:172`
- [x] 4.8 `404.astro` — tighten the double hedge, add a contact address
- [x] 4.9 Decide `index.astro:75` `fig. 01 — the engineer`: delete, or replace with a fact (`granada, es — utc+1`)
- [x] 4.10 Lowercase the Title Case title in `temperature-zero-is-not-deterministic.md:2` to match the other two posts

## 5. Discoverability

- [x] 5.1 Replace the Person node with the version in `design.md` — `hasOccupation`, `seeks`, `image`, `description`, `knowsLanguage`, `hasCredential`, plain `jobTitle` forms
- [x] 5.2 Add the `ProfilePage` node to `index.astro:41`
- [x] 5.3 Add `BreadcrumbList` to `[...slug].astro`, `tags/[tag].astro`, `blog/index.astro`; add `isPartOf` to the `BlogPosting`
- [x] 5.4 Add a `noindex` prop to `Base.astro`; apply to `404.astro` and to tag archives with fewer than three posts; mirror in the sitemap `filter`
- [x] 5.5 `404.astro:7` — `path="/404/"`, real meta description
- [x] 5.6 Rewrite `rss.xml.js` per `design.md`: `atom:link` self, `lastBuildDate`, `language`, managing editor, `ttl`, label categories, `/blog/` channel link
- [x] 5.7 `astro.config.mjs` — `trailingSlash: 'always'`, sitemap `serialize` with `lastmod`
- [x] 5.8 Rewrite `public/robots.txt` with explicit allow directives for AI and answer-engine crawlers
- [x] 5.9 `llms.txt` — add the `## Optional` section, unwrap the hard-wrapped prose, name the systems base alongside the AI layer
- [x] 5.10 Add an `ogTitle` prop to `Base.astro`; pass the bare title from `[...slug].astro` and `tags/[tag].astro`
- [x] 5.11 Shorten `index.astro:52` to ~60 characters; trim the three post excerpts to ≤158; lengthen the `/blog/` and four tag descriptions past 120
- [x] 5.12 Put the literal role forms into `ENTITY_PARAGRAPH` and the section headings — "AI Engineer" currently appears on zero of 14 pages
- [x] 5.13 Generate favicon variants, `apple-touch-icon.png`, `site.webmanifest`, `theme-color`; link them from `Base.astro`
- [x] 5.14 `article:author` → the profile URL (`Base.astro:93`); add `og:image:type` and `<meta name="author">`
- [ ] 5.15 Decide the three future post dates: correct them, or gate them behind `draft: true` until they arrive — **open question for Salvador**: are the three future dates a publishing schedule or errors?
- [x] 5.16 Add cross-links inside the post bodies — there are currently zero links of any kind in the three markdown files — plus a related-posts block from tag overlap
- [x] 5.17 Promote the ten `###` headings in `temperature-zero-is-not-deterministic.md` to `##`

## 6. Performance

- [x] 6.1 `scripts/fonts.mjs:14` — drop mono 500 (change `global.css:79` to weight 400) and mono 600; **−30,508 B, −23% of landing-page weight**
- [x] 6.2 `scripts/fonts.mjs:16` — drop `'latin-ext'`; −91 KB from `dist/`, −3.3 KB from the render-blocking CSS on every page
- [x] 6.3 Emit the preload `<link>`s from `scripts/fonts.mjs` (filenames are content-hashed — do not hard-code); `as="font" type="font/woff2" crossorigin`
- [x] 6.4 `astro.config.mjs` — `inlineStylesheets: 'always'`
- [x] 6.5 Correct the dedup claim in the `src/styles/fonts.css:1-2` banner — it holds for two of three families
- [x] 6.6 Re-export `portrait.webp` at 780×920 pre-cropped to 0.848; fix the `width`/`height` attributes; add `srcset`/`sizes` — **partial**: `portrait-390.webp` ships at exactly 390×460, cropped from the 512×512 source, so nothing is upscaled at 1×. A 2× render is impossible without a new source file — see the deviations section.
- [ ] 6.7 Add a Cloudflare response-header rule for `/img/*` — `public, max-age=604800`, not `immutable` (those names are not hashed) — documented in `docs/infrastructure.md`; needs applying in the Cloudflare dashboard.
- [ ] 6.8 Add `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` to the existing header rule — documented in `docs/infrastructure.md`; needs applying in the Cloudflare dashboard.
- [ ] 6.9 Stage a CSP on a preview deployment: `default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'` — documented in `docs/infrastructure.md`; needs staging on a preview deployment.
- [x] 6.10 Run all OG cards through `oxipng -o4`; gitignore `og-default.png` and let `prebuild` produce it — **partial**: no `oxipng`/`pngquant` on this machine. ImageMagick lossless re-encode applied instead (pixel-identity verified), −8.3% on the default card. Note the OG script overwrites it on every regeneration.
- [x] 6.11 Re-measure against the baseline table in `design.md` and record the new numbers there

## 7. Layout and design system

- [x] 7.1 Add the 620–960px two-column step for `.three`, `.two`, `.steps`
- [x] 7.2 Add `max-width: 68ch` to `.col p`, `.excerpt`, `.rss-hint`, `.row .body`; `72ch` to `#work .row p` and `.feature .excerpt`; `60ch` to `.entity`
- [x] 7.3 Move horizontal padding outside `.wrap` for `.topbar`, `.strip`, `.foot` — repairs the 48px spine break above 1240px (`TopBar.astro:26`, `index.astro:222`, `Footer.astro:25`)
- [x] 7.4 `@media (max-width: 960px) { .ambient { display: none } }`
- [x] 7.5 `Cover.astro:38-46` — raise `.ttl` to ≥ 0.5 opacity and drop the duplicate `.feature-title`, or remove `.ttl`
- [x] 7.6 `Cover.astro` `.thumb` at ≤620px — hide, or make it a full-width band with an inline tag; it currently reads as a broken image placeholder
- [x] 7.7 44px minimum hit areas below 760px on `.topbar .links a`, `.foot .elsewhere a`, `.mono-link`, `.chip`
- [x] 7.8 Shorten the brand string below 560px, or move `.links` to their own row — the bar double-stacks between 461 and 513px
- [x] 7.9 `.prose pre` at ≤620px — 12px and reduced padding, or `white-space: pre-wrap`; currently 48% of the line is off-screen
- [x] 7.10 Collapse the type scale from 14 steps to 10; add `--text-h1: 40px`, `--text-h1-lg: 52px`, `--text-h3: 19px`, `--text-body-md: 15px`, `--tracking-wide: 0.04em`; delete `--text-body-sm`, the 16.5px, 10.5px and 10px one-offs
- [x] 7.11 Delete the three unreferenced tokens: `global.css:7,13,16`
- [x] 7.12 `main > .section:last-child { border-bottom: 0 }` — removes the 2px rule above the footer
- [x] 7.13 `@media (max-width: 560px)` — stack `.head` and its trailing link
- [x] 7.14 Make `--space-section-y` responsive; clamp the 404 padding
- [x] 7.15 Add `<meta name="color-scheme" content="light">` and a `@media print` block
- [ ] 7.16 Optional, flagged not fixed: `--border` measures 1.24:1 and `--border-strong` 1.47:1 against white, and both are the sole affordance for `.chip` and `.btn-outline` — below the 3:1 UI-component threshold — **flagged, not fixed**, as proposed. `--border` measures 1.24:1 and is the only affordance on `.chip` and `.btn-outline`. Changing it is a visible brand decision, not a bug fix.

## 8. Deduplication and hardening

- [x] 8.1 Extract `src/components/PostRow.astro` — `blog/index.astro:50-64` and `tags/[tag].astro:74-88` are character-identical, plus ~28 lines of identical CSS
- [x] 8.2 Extract `.graph-paper` into `global.css` — the hero background is copy-pasted six times (`index.astro:185`, `services.astro:183`, `blog/index.astro:71`, `tags/[tag].astro:95`, `Cover.astro:19`, `og.mjs:97`)
- [x] 8.3 Extract `SectionHead.astro` (`{index, title, action?}`) and `WorkRow.astro`; move `.rows`/`.row`/`.year`/`.cta`/`.alt` and one `.chip` base into `global.css`
- [x] 8.4 Add `BLOG` to `consts.ts` (name, title, description) — the description is duplicated at `blog/index.astro:28` and `rss.xml.js:11`
- [x] 8.5 Move title suffixing into `Base.astro` behind a `titleSuffix` prop; remove the five hand-written suffixes
- [x] 8.6 Add `Props` interfaces to `Cover.astro:5`, `Footer.astro:3`, `TopBar.astro:3`; type `variant` and `navSlot` as unions
- [x] 8.7 `TopBar.astro:7,17` and `Footer.astro:15` — use `SITE` instead of hard-coded strings; clears the only `ts(6133)`
- [x] 8.8 `og.mjs` — validate every post before `rmSync` and before `puppeteer.launch`; `throw` inside the loop and set `process.exitCode` after `finally`, so a failure cannot orphan Chromium or leave fewer cards than it started with
- [x] 8.9 `og.mjs` — add the title clamp and the >150-character build-time guard
- [x] 8.10 `og.mjs:78` — stop regex-scraping `src/tags.ts`; import it, or generate a shared JSON. Running Prettier over that file currently breaks the build
- [x] 8.11 `og.mjs` — take colours and typography from the shared tokens instead of the eight hard-coded values; make card generation incremental via a digest manifest
- [x] 8.12 `og.mjs:153` — `headless: true`
- [x] 8.13 Add tag-archive OG cards (`label` + `blurb` through the existing `postCard` template)
- [x] 8.14 Tighten `content.config.ts`: `.strict()`, `readingTime` required, `excerpt` capped at the meta-description length, `cover` constrained
- [x] 8.15 `scripts/pages-upload.mjs:9` — read the Cloudflare JWT from the environment, not `argv[2]`; update `docs/infrastructure.md:16`
- [x] 8.16 `Base.astro:104` — add `is:inline` to the JSON-LD script
- [x] 8.17 Normalise en dashes in year ranges, US/GB spellings against the declared `en_GB`, and `K8s` → `Kubernetes`
- [x] 8.18 Clean `docs/`: drop the stale `/cv/salvador-criado-cv.pdf` instructions from `docs/design/README.md:94,103`; decide whether the 751 KB PDF stays as a design artefact — **partial**: the stale `/cv/…pdf` serve instruction is gone; the 752 KB PDF itself is left in `docs/design/assets/` for Salvador to decide on.

---

## Deviations from the proposal, and why

Recorded because each one contradicts something `proposal.md` or `design.md` asserts.
Every number below was measured on the production build, Chrome headless, 1440×900,
throttled to 1.6 Mbps / 150 ms RTT / 4× CPU, median of three runs.

**Font preload was removed, not added.** The proposal called for preloading the two
critical faces. Measured on the landing page, it made things worse: LCP 628 ms with the
preloads, 380 ms without, 448 ms preloading the display face alone. The cause is that this
page's LCP element is the portrait image, and 68 KB of woff2 fetched at high priority ahead
of it wins the bandwidth. CLS was 0.0013 in all three configurations, so the preload was
not buying stability either. `scripts/fonts.mjs` still emits `fonts.preload.json` so the
decision can be revisited cheaply; `Base.astro` carries the numbers as a comment.

**The layout shifts were reflow, not font metrics.** The design note assumed a
metrics-matched fallback was a refinement. It was the whole fix: line-heights here are
unitless, so line boxes never moved — what moved was the *line breaking*, because Space
Grotesk sets 8.3% wider than Arial. Two fallback faces with `size-adjust` (108.3% and
100.8%, measured against these exact files rather than taken from a table) took `/404` from
0.0804 to 0, and posts and tag archives from 0.0093 and 0.0001 to 0.

**`--measure` is in `em`, not `ch`.** A `ch`-based cap is itself font-dependent — `ch` is
the advance of the "0" glyph — so the caps changed width at swap time and re-wrapped the
paragraph they were meant to protect. That was the last shift left on `/blog/` (0.0163).
IBM Plex Sans measures 1ch = 0.6em, so the caps are 40.8em and 43.2em.

**The claims workstream was scaled back, at Salvador's direction.** He asked for a site that
projects the profile and shows what he has done and can do, not a strictly hedged one. So
the stat strip keeps `8+ yrs`, `<2.0s`, `100k+` and `3 clouds` as written. Two changes were
made anyway: the Azure migration now reads as in progress with an open-ended date, because
presenting an uncompleted cutover as a completed zero-downtime one is the single line most
likely to be probed in an interview and the honest answer would contradict the page; and
"users on my platforms" became "users on platforms i've run", which costs nothing and drops
a proprietor register `career.md:280` explicitly vetoes.

**Node floor is 22.12, not 20.** `puppeteer@25` declares `engines.node: ">=22.12.0"`, and
`prebuild` needs it. Astro alone would have allowed 20.

**A 2× portrait is still missing and needs Salvador.** `portrait-390.webp` is a true
390×460 crop of the 512×512 source — a 0.899× downsample, no invented pixels — so nothing
is upscaled at 1× any more, at any breakpoint. But 512×512 is all the pixels that exist, so
a 2× render is not possible. Ask: the original camera file, at least 1200 px wide with
headroom around the subject (the 0.848 crop trims 15% of width), ideally ≥1024×1210.

**All seven tag archives are `noindex`.** The threshold is three posts; the largest archive
has two. This is the rule working as designed on a three-post blog, not a special case —
they re-enter the index on their own as posts accumulate. The sitemap filter in
`astro.config.mjs` derives the same set from frontmatter so the two cannot disagree.

**The OG card palette is knowingly off-brand.** `scripts/tokens.mjs` now holds the card's
sRGB values in one place and documents that `#2b2833` / `#65616f` are *not* the conversions
of `--ink` / `--text-muted` (which are `#14151f` and `#565763`). Current rendering was
preserved rather than silently restyling all ten cards. One line per token to fix when the
cards are next re-cut.

**Incremental OG generation does not help CI.** `public/img/og/` is gitignored, so the
digest manifest never reaches a runner and CI always renders all ten cards. It is a
local-dev speedup until that directory is cached between builds.

## Measured, after

| Page | LCP (throttled) | CLS | Requests | Blocking CSS files |
|---|---|---|---|---|
| `/` | **420 ms** (was 444) | **0.0012** (was 0.0002) | 7 | **0** (was 2) |
| `/blog/` | **224 ms** (was 396) | **0** (was 0.0013) | 5 | **0** (was 1) |
| `/blog/rag-ranking-not-retrieval/` | **276 ms** (was 400) | **0** (was 0.0093) | 6 | **0** (was 1) |
| `/blog/tags/rag/` | **248 ms** (was 424) | **0** (was 0.0001) | 5 | **0** (was 1) |
| `/404` | **224 ms** (was 368) | **0** (was 0.0145) | 5 | **0** (was 1) |

Fonts: 3 files, **82,708 B** (was 5 files, 113,216 B on the landing page, plus 91,012 B of
`latin-ext` shipped and never requested). Landing page total ≈ **105 KB** against a measured
134,327 B baseline, **−22%**. Zero client-side JavaScript and zero third-party origins, both
unchanged. Zero console errors on every page. `astro check`: 0 errors, 0 warnings, 0 hints.
`check-dist`: 228 internal links resolve, every post has a card, sitemap and `llms.txt` agree.
