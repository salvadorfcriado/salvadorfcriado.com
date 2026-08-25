# Design — site audit remediation

Audit run 2026-08-25 against a production `astro build`, in Chrome, at 375 / 768 / 1024 /
1440 / 1920 / 2560 CSS px, unthrottled and at 1.6 Mbps / 150 ms RTT / 4× CPU. Six parallel
reviewers. Every number below was measured.

---

## Decision 1 — `/services/` is deleted from this repo, not reframed and not delisted

**Context.** `src/pages/services.astro:5-6` claims the page is already isolated:

```
/* Commercial surface. Deliberately OUT of the main navigation (services-surface spec):
   reachable from scdap.es and direct links, never from the hiring-facing pages. */
```

That isolation does not exist. Measured: `/services/` is the last `<loc>` in
`dist/sitemap-0.xml`; `public/robots.txt` is `Allow: /`; `src/pages/llms.txt.ts:30` names
it — `- [Consulting](…/services/): SCDAP — architecture and delivery engagements.`; and
`docs/infrastructure.md:91` redirects the whole `scdap.es` zone *into* it. It is a
link-graph orphan (`grep -rl 'href="/services/"' dist/` → no matches) that is crawled
anyway, through three separate channels.

The copy is not marginal. `services.astro:58` declares a `ProfessionalService` whose
`provider` is the same `#person` node the hiring pages use — the company framing is in
the structured data, not just the prose. Plus `SCDAP — Consulting` (`:75`),
`Book a 30 min call — free` (`:82`), `granada · remote-first · < 24 h reply · standard nda ·
es invoicing` (`:83`), `Founding-engineer mindset, not hourly consultant` (`:20`),
`Hourly, retainer or project` (`:42`).

`CLAUDE.md` prohibits services CTAs and founder/company framing for this audience.
`career.md:280` is blunter: *"El framing antiguo de 'empresa propia' está vetado — resta
credibilidad en candidaturas como empleado."* `career.md:320` sets the contract type as
permanent employee, not freelance-only.

**Options considered.**

*Delist from nav, keep the page.* Buys nothing. It already isn't in the nav. It ranks
anyway, and it is the second thing `llms.txt` tells a model about him — so the answer to
"is he available?" comes back *consultant*.

*`noindex` + sitemap filter + drop the llms.txt line + delete the `ProfessionalService`
block.* Better, and it is the fallback if a second deploy target is genuinely unwanted.
But the `Person` node still ends up as a service provider, and the page still exists to
drift.

*Reframe as a capabilities page.* Strip the commercial mechanics — free call, NDA, ES
invoicing, hourly/retainer, handover, "your team keeps the relationship" — and what
remains is a stack list plus two case studies that are already on the landing page at
`index.astro:22-39`. A rewrite that produces a duplicate of the home page, under a URL
whose slug still says "services".

**Decision.** Delete the file. Move the consulting surface to `scdap.es`, which is the
brand it belongs to. Invert the existing zone rule: `salvadorfcriado.com/services/*` →
`https://scdap.es/` (301). One zone change, one file deleted, and the hiring domain has
zero commercial surface. Every existing inbound link keeps working.

---

## Decision 2 — the CV data comes back as HTML; the PDF does not

The archived change gives the removal reason as maintenance: *"The PDF has to be
regenerated and redeployed every time the career file moves, and the site's focus is the
blog plus a short introduction, not a résumé mirror."* That reasoning holds, and per-offer
CVs belong in the `/generate-cv` pipeline where they already are. This change does not
reverse it.

But the removal took the *experience data* with it and nothing replaced it. An employer
arriving from a Google search cannot learn employers, dates, seniority, progression, the
degrees (career.md:255-258 — MSc UPM, BEng Telecoms UGR), or English level
(career.md:22 — a gating fact for "remote worldwide"). `index.astro:106` sends them to
LinkedIn instead:

```html
<a class="mono-link" href={SITE.linkedin} rel="noopener" target="_blank">full history on linkedin →</a>
```

That means the site's only job is to *survive* the visit. It cannot do any work.

The resolution that respects the archived decision: a compact `<dl>` in section 04 —
**Now / Before / Education / Languages / Stack**, four or five lines. Indexable where a
PDF is not, one edit when `career.md` moves, and it cannot go stale silently behind a
build step. The certs are already handled this way at `index.astro:171` and it works.
`/cv/*` → `/` stays as is.

---

## Decision 3 — what the numbers on the landing page are allowed to say

Four claims fail against `career/career.md`. Each is rewritten rather than deleted,
because each has a true version that is still strong.

| Shipped | Source of truth | Rewrite |
|---|---|---|
| `index.astro:35-37` — "lifted onto AKS … a cutover with the service staying up", `y: '2026'` | career.md:145 "Marzo 2026 – Presente"; career.md:32 "en curso" | "…moving onto AKS — Terraform, Azure DevOps pipelines, tenant-by-tenant cutover plan. In progress." `y: '2026 — now'` |
| `index.astro:64` — "Eight years owning distributed systems on AWS and Azure" | career.md:314 "8+ años totales. ~5 años con foco fuerte en cloud/DevOps"; Azure from 2022 (career.md:191) | "Eight years shipping production systems — the last five on AWS and Azure, owning event-driven pipelines, real-time telemetry and the Terraform under them." |
| `index.astro:18` — `100k+ / users on my platforms` | career.md:150 — 100k+ on **one** client-owned platform | `100k+ / users on a platform i migrated` |
| `index.astro:19` — `3 / clouds: aws · azure · on-prem` | on-prem is not a cloud; the third item is the client's GPU box (career.md:159) | `AWS + Azure / plus on-prem gpu serving` |

Also `services.astro:30,164` claims 10,000 signals/sec against career.md:196's documented
**1,000+**, and merges the Iyris sensor count with the TMC nuclear throughput into one
project that never existed; `services.astro:165` dates it `2023—25`, which matches no
engagement (Iyris is Aug 2024 – Dec 2025, Nazaríes Feb 2018 – Jan 2022). Deleting the file
resolves all three. Separately, `career.md:298` carries a stray "10k events/s" in the
CV-axis mapping table that contradicts career.md:196 — that line is the outlier and should
be corrected in the source of truth, with the user's confirmation, rather than propagated.

The Azure cutover is the specific one worth arguing: it is the single claim most likely to
be probed — *"walk me through the cutover"* — and the honest answer today is "we haven't
cut over yet". That exchange costs more than the bullet earns.

---

## Decision 4 — the evidence has to carry the base, not just the prose

The positioning language is already correct. `index.astro:167-171`:

> "I started close to the metal, on PCBs and firmware, and worked up through distributed
> systems to platforms carrying a hundred thousand users. Applied AI is the newest layer
> on that stack, not a replacement for it: I still reach for Terraform and a profiler
> before I reach for a bigger model."

And `llms.txt.ts:24-25` states it outright. But the *evidence* is AI-only: both selected-work
rows are AI or migration, three of four stats are AI-flavoured, two of three "what I do"
columns are AI. Nothing on the hiring surface shows what `career.md:282` calls the central
message — EDA, real-time streaming, time-series, high-throughput ingestion,
mission-critical alerting.

The 1,000+ sensor pipeline and the nuclear-plant alert filter (career.md:184, :196) are the
most differentiating credentials in the file and they appear **only** on `/services/` —
the page that is being deleted. So a third work row is not decoration; it is where that
material goes:

```js
{
  t: 'Real-time telemetry platform for 1,000+ industrial sensors',
  d: 'Event-driven ingestion on AWS Lambda and IoT Core, time-series validation and routing, ' +
     'critical-event detection and alerting — plus an LLM layer answering questions over the live data. ' +
     'Took ownership after the team went from 20+ engineers to a handful.',
  y: '2024—25',
}
```

The "20+ engineers down to a few, and it kept running" detail (career.md:179) is the
strongest single line available for an employer audience and is currently unused anywhere.

---

## Decision 5 — Shiki theme, not a CSS override

Measured on every post page: `pre` computed `background-color: rgb(36, 41, 46)`, child
`span` computed `color: oklch(0.2 0.02 280)` → **1.24:1** at 13.5px/400.

Cause chain: Astro's default Shiki theme is `github-dark`, which writes
`style="background-color:#24292e"` **inline** on the `<pre>`. Inline style beats the author
rule at `[...slug].astro:107` (`background: var(--surface)`), so the surface never lands.
Then `[...slug].astro:115` sets `color: var(--ink)` on `pre code`, painting near-black text
onto that dark plate.

Two ways out. Adding `!important` to the background wins the cascade but leaves the
highlighter emitting dark-theme span colours into a light plate — the syntax colours would
then be wrong instead of the background. The correct fix is upstream:

```js
// astro.config.mjs
markdown: { shikiConfig: { theme: 'github-light' } }
```

and drop the `color: var(--ink)` override so Shiki's own token colours apply. Do not leave
the theme at default.

---

## Decision 6 — measure before breakpoint, and a two-column step

The grids drop 3→1 at `max-width: 960px`, so 13.5px copy spans the full content width.
Measured characters per line:

| viewport | selector | width | cpl |
|---|---|---|---|
| 768 | `/` `.col p` (`index.astro:288`) | 720px | **107** |
| 960 | `/` `.col p` | 912px | **135** |
| 960 | `/` `.excerpt` | 912px | **130** |
| 960 | `/` `.rss-hint` | 912px | **127** |
| 1440–2560 | `/` `#work .row p` | 634px | **94** |
| 1440–2560 | `/` `.feature .excerpt` | 669px | **96** |
| 1440–2560 | footer `.entity` | 700px | **127** |

Comfortable is 45–85. Two independent fixes, both needed: a 2-column step between 620 and
960, *and* a `ch`-based cap on the paragraph classes — the cap alone leaves a 912px column
with a 68ch paragraph floating in it, and the step alone still gives 107 cpl at 768 for
the single-column cases.

The 48px spine break is a separate class of bug and worth naming precisely: `.topbar .bar`,
`.strip .cell` and `.foot .inner` apply `--space-section-x` *inside* `.wrap`, while
`.section` applies it *outside*. Content column widths therefore differ — 1144px vs 1240px —
and above 1240px viewport the two groups sit 48px apart at every size (measured at 1336,
1440, 1920, 2560). Fix by moving the padding onto the outer element in all three cases.

---

## Decision 7 — font budget

Fonts are **84.3%** of the landing page's 134,327 encoded bytes. Two independent wins:

**Mono weights.** `scripts/fonts.mjs:14` requests `IBM+Plex+Mono:wght@400;500;600`. Google
serves Plex Mono as *static* instances, so the content-hash dedup at `fonts.mjs:52-57`
finds nothing to collapse — unlike Space Grotesk and Plex Sans, which are variable and
reduce to one file each. Three files ship: 14,708 + 14,888 + 15,620 B = **45,216 B, 34% of
the page**. Weight 500 is used by exactly one rule (`.label`, `global.css:76-83`); weight
600 by two (`.n` at `index.astro:226`, `[...slug].astro:124`). Dropping to a single mono
weight is **−30,508 B (−23%)**. Proof the mechanism works: the blog-post page already
fetches only 4 fonts (98,328 B) because it never uses mono 500.

The banner comment at `src/styles/fonts.css:1-2` claiming dedup is true for two of three
families and should say so.

**latin-ext.** Five woff2 files, **91,012 B**, 12% of `dist/` — never requested on any page,
because all content is Latin-1. They are also 10 of the 20 `@font-face` blocks that make up
**6,712 B (60%)** of the 11,190 B render-blocking shared CSS. CSS coverage confirms
68–73% of that file unused on every page, almost entirely those declarations. Drop
`'latin-ext'` from `fonts.mjs:16` unless Spanish-language posts are planned — and if they
are, that is Decision 8's territory, not a reason to ship the subset today.

Note what is **not** wrong: the two CSS bundles do not duplicate rules. `_slug_.DT1vMMU3.css`
is global + TopBar + Footer, correctly shared; `index.P7q6IMBL.css` is landing-only scoped
styles. The landing page carries a second blocking request purely because its scoped CSS is
6,370 B against Astro's 4 KB inline threshold — `inlineStylesheets: 'always'` fixes that,
and all page CSS combined is 17.5 KB raw / ~3.1 KB gzipped.

---

## Decision 8 — no Spanish surface in this change

`<html lang="en">` on all 14 pages, no `hreflang`, no `/es/`. Queries like
*ingeniero IA Granada* or *arquitecto software Granada remoto* have nothing to match, and
local Spanish recruiters are a real segment of the stated audience.

Deliberately out of scope here. It is a content-volume commitment (three posts would become
six surfaces), it interacts with the `latin-ext` decision above, and it deserves its own
change rather than riding along with a remediation pass. Named so it is not silently
assumed to be covered.

---

## Ready-to-paste JSON-LD

### Person — replaces `src/layouts/Base.astro:48-64`

`alternateName` is deliberately absent. If an X, Mastodon, Stack Overflow or ORCID profile
is added later, append it to `sameAs` — that array is the strongest entity-reconciliation
signal available and two entries is thin.

```js
const person = {
  '@type': 'Person',
  '@id': `${SITE.url}/#person`,
  name: SITE.name,
  givenName: 'Salvador',
  familyName: 'Criado',
  jobTitle: ['AI Engineer', 'Platform Engineer', 'Software Architect'],
  description:
    'AI engineer and platform engineer in Granada, Spain, working remotely. Eight years owning ' +
    'distributed systems in production; LLM applications, RAG, agentic systems and real-time voice ' +
    'on a backbone of AWS, Azure, Terraform and Kubernetes.',
  url: SITE.url,
  mainEntityOfPage: { '@id': `${SITE.url}/#profilepage` },
  image: { '@type': 'ImageObject', url: `${SITE.url}/img/portrait.webp`, width: 780, height: 920 },
  email: `mailto:${SITE.email}`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: SITE.locality,
    addressRegion: SITE.region,
    addressCountry: SITE.country,
  },
  workLocation: [
    { '@type': 'Place', name: 'Granada, Spain' },
    { '@type': 'VirtualLocation', name: 'Remote (worldwide)' },
  ],
  knowsLanguage: [
    { '@type': 'Language', name: 'Spanish', alternateName: 'es' },
    { '@type': 'Language', name: 'English', alternateName: 'en' },
  ],
  hasOccupation: {
    '@type': 'Occupation',
    name: 'AI Engineer',
    /* O*NET-SOC — Software Developers. 15-2051.00 would read as data science instead;
       do not list both. */
    occupationalCategory: '15-1252.00',
    skills: KNOWS_ABOUT.join(', '),
    occupationLocation: {
      '@type': 'City',
      name: 'Granada',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Granada',
        addressRegion: 'Andalusia',
        addressCountry: 'ES',
      },
    },
  },
  seeks: {
    '@type': 'Demand',
    name: 'Full-time employment as an AI engineer or platform engineer',
    description:
      'Open to permanent roles building LLM applications, RAG and agentic systems, and the ' +
      'cloud platform underneath. Remote preferred; on-site in Granada and surroundings.',
    availableAtOrFrom: { '@type': 'Place', name: 'Remote — Granada, Spain (UTC+1)' },
  },
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      name: 'AWS Certified DevOps Engineer — Professional',
      credentialCategory: 'certification',
      recognizedBy: { '@type': 'Organization', name: 'Amazon Web Services' },
    },
    {
      '@type': 'EducationalOccupationalCredential',
      name: 'Agentic AI',
      credentialCategory: 'certification',
      recognizedBy: { '@type': 'Organization', name: 'DeepLearning.AI' },
    },
    {
      '@type': 'EducationalOccupationalCredential',
      name: 'Certified ScrumMaster (CSM)',
      credentialCategory: 'certification',
      recognizedBy: { '@type': 'Organization', name: 'Scrum Alliance' },
    },
  ],
  sameAs: [SITE.linkedin, SITE.github],
  knowsAbout: KNOWS_ABOUT,
};
```

### ProfilePage + WebSite — `src/pages/index.astro:41`

```js
const jsonLd = [
  {
    '@type': 'ProfilePage',
    '@id': `${SITE.url}/#profilepage`,
    url: `${SITE.url}/`,
    name: 'Salvador F. Criado — AI & Platform Engineer',
    mainEntity: { '@id': `${SITE.url}/#person` },
    isPartOf: { '@id': `${SITE.url}/#website` },
    inLanguage: 'en',
  },
  {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: 'AI & Platform Engineer — LLM applications, agents, real-time voice, and the cloud backbone underneath.',
    publisher: { '@id': `${SITE.url}/#person` },
    inLanguage: 'en',
  },
];
```

`ProfilePage` with `mainEntity: Person` is what Google documents for a page *about* one
person; `WebSite` alone does not get that treatment.

### BreadcrumbList — posts (`[...slug].astro:24`)

Add `isPartOf: { '@id': `${SITE.url}/blog/#blog` }` to the existing `BlogPosting` while in
there — it currently floats unattached to the `Blog` node defined in `blog/index.astro:18`.

```js
{
  '@type': 'BreadcrumbList',
  '@id': `${SITE.url}/blog/${post.id}/#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.url}/` },
    { '@type': 'ListItem', position: 2, name: 'Field notes', item: `${SITE.url}/blog/` },
    { '@type': 'ListItem', position: 3, name: tagLabel(d.tags[0]), item: `${SITE.url}/blog/tags/${d.tags[0]}/` },
    { '@type': 'ListItem', position: 4, name: d.title },
  ],
}
```

Tag archives and `/blog/` take the same shape, truncated at position 3 and 2 respectively.

---

## Measured baseline — hold these as the regression floor

Chrome headless, 1440×900, DPR 1. Throttled = 1.6 Mbps / 150 ms RTT / 4× CPU.

| Page | LCP unthr. | LCP thr. | LCP element | CLS | Requests | Encoded bytes | woff2 |
|---|---|---|---|---|---|---|---|
| `/` | 112 ms | 444 ms | `IMG` portrait.webp | 0.0002 | 10 | 134,327 | 5 (113,216 B) |
| `/blog/` | 40 ms | 396 ms | `P.sub` | 0.0013 | 7 | 118,221 | 5 |
| `/blog/rag-ranking-not-retrieval/` | 40 ms | 400 ms | `H1` | 0.0093 | 7 | 122,567 | 4 (98,328 B) |
| `/blog/tags/rag/` | 44 ms | 424 ms | `P.sub` | 0.0001 | 7 | 118,203 | 5 |
| `/services/` | 56 ms | 436 ms | `H1` | 0.0352 | 7 | 120,112 | 5 |
| `/404` | 32 ms | 368 ms | `P.body` | 0.0145 | 7 | 116,559 | 5 |

Every measured CLS event fires at the moment the fonts swap — there is no other source.
Preloading shrinks the window; a metric-matched fallback `@font-face` closes it.

Landing-page bytes: fonts 113,216 (84.3%) · portrait 13,884 (10.3%) · HTML 3,803 gz (2.8%) ·
CSS 3,153 gz (2.3%) · favicon 271.

---

## Verified clean — do not re-litigate

Zero client-side JS on all six pages (`script[src].length === 0`; the only `<script>` is one
`application/ld+json` block). Zero third-party origins. Console clean on every page with
`pageerror` and `requestfailed` listeners attached before navigation — the only output
anywhere was the browser's own 404 line on a deliberately missing URL. No horizontal
document overflow at any of 6 viewports × 6 pages. `dist/` is 36 files, 736 KB, with no
source maps and nothing that shouldn't ship. Exactly one `<h1>` per page. Heading order
valid everywhere except `/services/`, which is being deleted. `aria-current="page"` correct
on tag chips. Canonicals absolute and trailing-slash-consistent on 13 of 14 pages. `og:image`
absolute with explicit width/height/alt; all four OG cards verified 1200×630. `twitter:card`
correct. RSS discovery link on all 14 pages. Sitemap referenced from robots.txt with 404
correctly excluded. Colour is 100% tokenised — zero hard-coded hex anywhere in `src/`
outside `global.css`. `prefers-reduced-motion` needs no gating: zero keyframes, zero
animation, zero transform, and the only two transitions are colour-only. Tag archives are
generated from posts in use, never from the vocabulary. `.wrap` max-width containment holds
identically at 1440, 1920 and 2560 — nothing stretches.
