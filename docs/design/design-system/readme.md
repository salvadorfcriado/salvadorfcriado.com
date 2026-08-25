# salvadorfcriado.com — Design System

Personal brand system for **Salvador F. Criado**, Senior AI Engineer (LLM applications, agentic systems, model deployment). Granada, Spain · remote. Purpose: transmit seniority to enterprise clients and technical recruiters; primary CTA is LinkedIn. Approved reference design: option **3a** in `Propuestas Web Personal.dc.html` (this project).

There is **no logo**: the brand is typographic — "Salvador F. Criado" set in Space Grotesk 700 (never include the second surname "Melero" in brand contexts). Small wordmark: `SALVADORFCRIADO.COM` in IBM Plex Mono 600, 11px, letter-spacing 0.04em.

## Content fundamentals

- **Language:** site copy in English. Tone: executive authority — confident, measured, zero hype. Claims are concrete and verifiable ("voice loop under 2 s", "100k+ users"), never superlatives.
- **Voice:** first person singular ("I build…", "I own…"). Short sentences. Em-dashes for expansion.
- **Casing:** sentence case for headings and buttons ("Connect on LinkedIn"). Mono labels are either UPPERCASE (`02 / SELECTED WORK`) or all-lowercase (`granada, es · remote · utc+1`) — never Title Case.
- **Technical terms** (stack names, metrics, dates) live in IBM Plex Mono. Dates in ISO form: `2026-08-12`.
- **Numbered sections:** `01 / WHAT I DO`, `02 / SELECTED WORK`… echoes an engineering dossier.
- **No emoji. No exclamation marks.** The only symbol allowed as ornament: `●` for the availability badge, `→` for links, `[ … ]` brackets around the hero eyebrow.
- **Every page carries citable facts** (metrics, dates, stack names) — this is deliberate GEO/SEO material.

## Visual foundations

- **Color:** white base, cool neutrals at hue 280. ONE accent: violet `#6d5ae6` — used for CTAs, section labels, key words in headlines, availability badge. Never add a second strong color; alternating sections use `--surface`. Dark band (`--ink`) only for the closing CTA/footer strip.
- **Type:** Space Grotesk (display + buttons), IBM Plex Sans (body), IBM Plex Mono (labels, data, metadata). Masthead 88px/0.98/-0.045em. Section titles 28px/700. Mono labels 12px/0.06em.
- **Graph-paper motif:** hero sections get a 28px grid overlay via two repeating-linear-gradients in `--grid-line`. Use only on the hero, not everywhere.
- **Borders:** translucent hairlines (`--border`, ink at 10%). Sections divide with full-width hairlines; stat strips use internal 1px column rules. Never opaque grey borders.
- **Shadows:** none or near-none. Cards are border-defined, not shadow-defined.
- **Radii:** buttons 6px, cards 10px, images 12px, chips 5px. Circle only for avatars.
- **Buttons:** primary = `--accent` bg, white text, Space Grotesk 600 14px, padding 12px 22px, radius 6px. Secondary = white bg, `--border-strong` border, ink text. Hover: primary darkens to `--accent-strong`; secondary fills with `--accent-soft`. Transitions: color only, ~150ms. No scale/translate effects.
- **Dotted leaders** (index rows, trace tables): flex spacer with `border-bottom: 1px dotted` ink at 25-30%.
- **Stat strips:** 4 columns, mono 600 numbers 24-26px, mono 11px lowercase captions.
- **Photos:** real photography, rounded 10-12px, hairline border. Optional caption chip overlaid bottom-left: ink bg, white mono 10.5px, e.g. `fig. 01 — the engineer`. No illustrations, no stock-art vibes, no gradients.
- **Layout:** content max 1240px; horizontal padding 48px; section vertical padding 52-64px. Grid/flex with gap, 4px rhythm.

## Iconography

None. Structure is expressed typographically (numbers, brackets, rules, dotted leaders). If icons ever become necessary, use Lucide via CDN at 16px / stroke 1.75 and document it here — never hand-drawn SVG, emoji, or unicode glyphs as icons.

## Index

- `styles.css` — entry point (imports only).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`.
- `SKILL.md` — Agent Skill wrapper for Claude Code.
- Reference design: `../Propuestas Web Personal.dc.html`, option `#3a` (approved), `#3b` (compact variant).
