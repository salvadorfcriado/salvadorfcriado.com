# Handoff: salvadorfcriado.com — Personal brand site + blog

## Overview
Personal marketing site for **Salvador F. Criado**, Senior AI Engineer (LLM applications, agentic systems, model deployment; Granada, Spain, remote). Goals: transmit seniority to enterprise clients and technical recruiters, host a technical blog, and rank aggressively in classic search (SEO) **and** generative engines (GEO — ChatGPT/Perplexity/AI Overviews). Primary CTA: LinkedIn (`https://linkedin.com/in/salvador-cm`). Secondary: download CV (PDF), email (`crimelero@hotmail.com`).

## About the Design Files
The files in `design-reference/` are **design references created in HTML** — a proposal canvas, not production code. Open `Propuestas Web Personal.dc.html` in a browser; the **approved design is option `#3a`** (the card labeled `3a`, top section). `3b` is an approved compact fallback; rounds 1-2 are discarded history — ignore them. The task is to **recreate design 3a as a real website**, not to ship this HTML.

## Target stack (no existing codebase)
There is no existing codebase. Choose a static-first framework optimized for SEO and low maintenance — **Astro is recommended** (content collections for the blog in Markdown, zero-JS by default, first-class sitemap/RSS). Next.js static export is an acceptable alternative. Requirements: fully static HTML output, blog posts as Markdown files (the owner will add posts by dropping `.md` files), no CMS, no client-side rendering of content.

## Fidelity
**High-fidelity.** Recreate option 3a pixel-faithfully: exact colors, fonts, sizes, spacings and copy listed below. The design tokens live in `design-system/` (CSS custom properties) — import `design-system/styles.css` or port the variables into the framework's global CSS.

## Design tokens (summary — full set in design-system/tokens/)
- Accent (only strong color): `#6d5ae6`; hover `#5445b8`; soft fill `rgba(109,90,230,0.08)`; over dark bg `#a99bf5`
- Ink (headings, dark band): `oklch(0.2 0.02 280)` · Muted body: `oklch(0.46 0.02 280)`
- Background `#fff`; alternate section `oklch(0.975 0.004 280)`
- Hairline border: `oklch(0.2 0.02 280 / 0.1)`; button outline: `/ 0.18`; graph-grid line: `/ 0.045`
- Fonts (Google Fonts, self-host WOFF2 in production): **Space Grotesk** (display/buttons; 400-700), **IBM Plex Sans** (body; 400-600), **IBM Plex Mono** (labels/data; 400-600)
- Radii: buttons 6px · cards 10px · images 12px · chips 5px
- Content max-width 1240px; horizontal padding 48px; section vertical padding 52px (hero 64px)
- Transitions: color only, ~150ms. No scale/translate animations, no shadows.

## Page structure (single landing page + blog)

### 1. Top bar
Full-width, 13px vertical padding, hairline bottom border. Three groups (flex space-between), all IBM Plex Mono 11px, letter-spacing 0.04em, muted color: left `SALVADORFCRIADO.COM` (600, ink, links home); center nav `WORK · WRITING · ABOUT` (anchor links); right `● OPEN TO ENGAGEMENTS` in accent violet. On blog pages the right slot may show `← BACK TO HOME`.

### 2. Hero / masthead (graph-paper background)
Two-column grid `1fr / 390px`, gap 56px, padding `64px 48px 56px`, hairline bottom border. Background: white + 28px graph grid (two `repeating-linear-gradient`s, lines `oklch(0.2 0.02 280 / 0.045)` 1px every 27px, horizontal + vertical).
- Eyebrow: mono 12px, ls 0.06em, accent: `[ SENIOR AI ENGINEER — LLM APPS · AGENTS · MODEL DEPLOYMENT ]`
- H1 (the brand): Space Grotesk 700, 88px, line 0.98, tracking -0.045em: `Salvador` (ink) line-break `F. Criado` (accent violet). **Never render the second surname "Melero".**
- Lead: 17px/1.6 IBM Plex Sans muted, max-width 520px: "I build production AI end to end — agents, RAG and real-time voice, plus the GPU inference underneath. 8+ years owning systems that ship."
- Buttons row: primary `Connect on LinkedIn` (accent bg, white, Space Grotesk 600 14px, 12px 22px, radius 6px) + secondary `CV (PDF)` (white bg, outline border, ink text) + mono caption `granada, es · remote · utc+1`.
- Right column: portrait photo 390×460px, radius 12px, with overlaid caption chip bottom-left (ink bg, white mono 10.5px, 6px 10px, radius 5px): `fig. 01 — the engineer`. Until the owner provides a photo, use a neutral placeholder.

### 3. Stat strip
4 equal columns, hairline top+bottom borders, internal 1px column dividers, each cell padding `20px 48px`. Number: IBM Plex Mono 600 24px ink; caption below: mono 11px muted lowercase.
Cells: `8+ yrs / systems in production` · `<2.0s / voice loop, end to end` · `100k+ / users on my platforms` · `3 / clouds: aws · azure · on-prem`.

### 4. Section `01 / WHAT I DO` (kept deliberately brief — 3 one-liners, not a service catalog)
Padding 52px 48px, hairline bottom border. Label: mono 12px ls 0.06em accent `01 / WHAT I DO`. Then 3 columns separated by hairline vertical rules (32px inner padding):
1. **Agents & LLM apps** — "RAG, tool calling, voice loops under 2 s — grounded in your data."
2. **Serving & evaluation** — "vLLM, quantisation, Langfuse tracing — quality you can measure."
3. **Cloud backbone** — "Deep AWS, expert Terraform, Kubernetes — the platform under the model."
Titles Space Grotesk 600 17px ink; body 13.5px/1.6 muted.

### 5. Section `02 / SELECTED WORK` (only 2 rows — low maintenance by design)
Background `oklch(0.975 0.004 280)`, padding 52px 48px, hairline bottom border. Header row: label `02 / SELECTED WORK` + right-aligned mono link `full history on linkedin →`.
Rows (grid `1fr 1.5fr 120px`, gap 32px, padding 20px 0, hairline between):
1. "On-prem voice agents for an enterprise contact centre" / "Agentic flows, RAG on Qdrant and a streaming voice loop under 2 s — on the client's own GPU, data never leaves the network." / `2025—26`
2. "Invoices to postable entries, in seconds" / "OCR + LLM pipeline on Bedrock + Claude with guardrails, human review and a full audit trail." / `2026`
Titles Space Grotesk 600 16px; descriptions 13.5px muted; dates mono 12px right-aligned.

### 6. Section `03 / WRITING` — the blog (most important section)
Padding 52px 48px, hairline bottom border. Header: label `03 / WRITING` + H2 `Field notes` (Space Grotesk 700 28px, -0.02em) + right link `ALL POSTS →` (mono 12px accent, links to /blog).
Grid `1.25fr / 1fr`, gap 36px:
- **Featured post (latest):** cover image 100%×300px radius 10px; mono meta `2026-08-12 · rag · 9 min`; title Space Grotesk 700 24px; 1-2 sentence excerpt 14px muted. Whole card links to the post.
- **Right column:** next 2 posts as rows — thumbnail 132×96px radius 8px + mono meta + title Space Grotesk 600 16.5px. Below, an optional RSS/newsletter hint box (dashed hairline border, radius 8px, mono 12px).
This section must be **data-driven from the blog content collection** (latest 3 posts auto-populate).

### 7. Section `04 / ABOUT` + contact
Grid `1fr / 380px`, gap 56px, padding 52px 48px, hairline bottom border. Label `04 / ABOUT`; paragraph 15px/1.7 muted, max 560px: "Hands-on senior engineer in Granada, Spain — remote worldwide. From PCB and firmware to 100k-user platforms, now applied AI end to end. **AWS DevOps Pro · Agentic AI (DeepLearning.AI) · CSM.**" (bold segment in ink 500). Buttons: primary `Connect on LinkedIn` + outline `crimelero@hotmail.com` (mailto). Right: ambient photo 380×240px radius 10px.

### 8. Footer
Padding 22px 48px, flex space-between, baseline-aligned:
- Entity paragraph (**required for GEO**), 11px/1.6 muted, max 700px: "Salvador F. Criado — Senior AI Engineer, Granada (Spain), remote. LLM applications, agents, real-time voice, vLLM serving, AWS · Azure · Terraform · Kubernetes."
- `© 2026 salvadorfcriado.com` mono 11px.

### Blog pages (design not mocked — derive from the system)
- `/blog`: same top bar + a masthead-lite (H2 `Field notes`, mono label) + chronological list reusing the row pattern from section 6 (thumb + meta + title + excerpt).
- `/blog/[slug]`: content column max ~720px; title Space Grotesk 700 40px; mono meta line (ISO date · tag · read time); prose in IBM Plex Sans 17px/1.75; code blocks in IBM Plex Mono on `--surface` bg radius 10px; H2s 24px with mono `##`-style section numbering optional. End with a CTA row (Connect on LinkedIn) + author card (small circular portrait + entity blurb).

## Interactions & behavior
- Hovers: links & mono links → accent color; primary button bg → `#5445b8`; outline button bg → `rgba(109,90,230,0.08)`. Color transitions only, 150ms.
- Top bar nav anchors scroll to sections (native smooth scroll ok). No sticky behavior required.
- No JS-dependent content anywhere. No animations, no carousels, no dark mode (v1).
- Responsive: below ~960px collapse hero to single column (portrait below text, max-height ~420px), stat strip to 2×2, WHAT-I-DO and WRITING to single column, ABOUT stacks. Masthead scales 88 → 56 → 44px. Horizontal padding 48 → 24px. Hit targets ≥44px on mobile.

## State management
None — fully static site. Blog = Markdown content collection with frontmatter: `title, date (ISO), tag (one of: rag | voice | stacks | infra), readingTime (or compute), excerpt, cover (image path)`. Landing pulls latest 3 posts at build time.

## SEO & GEO requirements (first-class deliverable, not an afterthought)
1. **Semantic HTML:** one `h1` per page (home: the name; posts: the title), ordered `h2/h3`, `<main>/<nav>/<article>/<time datetime>`.
2. **JSON-LD** on every page: `Person` (name "Salvador F. Criado", alternateName "Salvador Francisco Criado Melero", jobTitle "Senior AI Engineer", address Granada/ES, sameAs → LinkedIn, knowsAbout → [LLM applications, RAG, agentic systems, real-time voice agents, vLLM, NVIDIA Triton, AWS, Azure, Terraform, Kubernetes]). Blog posts add `BlogPosting` (author → the Person, datePublished, headline). Add `WebSite` schema on home.
3. **Per-page meta:** unique `<title>` ("Salvador F. Criado — Senior AI Engineer | LLM Applications & Model Deployment"), meta description, canonical URL, Open Graph + Twitter card (generate a default OG image with the masthead typography).
4. **GEO specifics:** keep the footer entity paragraph verbatim on every page; concrete metrics and stack names in visible text (generative engines quote them); each blog post opens with a 2-3 sentence extractable summary; consider an `/about` FAQ block later (e.g. "On-prem LLM vs API?") marked up as `FAQPage`.
5. **Infrastructure:** `sitemap.xml`, `rss.xml`, `robots.txt` (allow all, reference sitemap), clean URLs (`/blog/rag-in-production`), `llms.txt` at root summarizing who Salvador is + key pages.
6. **Performance:** static output, self-hosted WOFF2 fonts with `font-display: swap`, images as optimized WebP/AVIF with explicit width/height and descriptive `alt`, Lighthouse ≥95 on all categories.
7. **Language:** `lang="en"`; hreflang only if a Spanish version is added later.

## Assets
- `assets/salvador-criado-cv.pdf` — the real CV. Source of truth for facts. **Not served by the site:** the `/cv` route and the "CV (PDF)" buttons were removed in commit 5924801.
- Portrait + ambient photos: **not provided yet** — build with neutral placeholders sized per spec; the owner will supply photos. If `design-reference/.image-slots.state.json` contains dropped images, extract and use those.
- Blog cover images: owner-provided per post; fall back to a generated typographic cover (title on `--surface` + graph grid).
- Fonts: Google Fonts families listed above (self-host in production).

## Files in this bundle
- `README.md` — this document (implementation source of truth).
- `design-reference/Propuestas Web Personal.dc.html` — proposal canvas; **option `#3a` is the approved design** (open in a browser; `support.js` + `image-slot.js` + `.image-slots.state.json` are its runtime/sidecar).
- `design-system/` — brand tokens (CSS custom properties), design guide (`readme.md`) and an agent skill (`SKILL.md`) usable directly in Claude Code for any future work on this brand.
- `assets/salvador-criado-cv.pdf` — CV.
