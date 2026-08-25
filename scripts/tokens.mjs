/* Card palette — the sRGB mirror of src/styles/global.css.
   ─────────────────────────────────────────────────────────────────────────────
   global.css is the source of truth for the brand, but it is authored in oklch
   and consumed by browsers that resolve `var()` at paint time. The OG cards are
   screenshotted from a standalone document with no stylesheet attached, so they
   need literal sRGB values. This file is that mirror.

   RULE: change a token here and in global.css in the SAME commit. There is no
   build step that keeps them in sync and nothing will fail if they drift — the
   only symptom is an OG card that is subtly off-brand, six weeks later, on
   somebody else's LinkedIn feed.

   Each entry below records the global.css token it mirrors, that token's oklch
   value, and the exact sRGB conversion of it. Where `value` differs from
   `exact`, it is because the card has always rendered with the listed value and
   changing it would restyle every card at once — deliberate, not eyeballed
   drift. If the cards are ever re-cut, move them to `exact`. */

export const CARD = {
  /* --bg */
  bg: '#ffffff',

  /* --accent · #6d5ae6 in global.css — no conversion needed, exact. */
  accent: '#6d5ae6',

  /* --ink · oklch(0.2 0.02 280) · exact sRGB #14151f
     Card renders the lighter #2b2833; see the note above. */
  ink: '#2b2833',

  /* --text-muted · oklch(0.46 0.02 280) · exact sRGB #565763
     Card renders the lighter #65616f; see the note above. */
  muted: '#65616f',

  /* --grid-line · oklch(0.2 0.02 280 / 0.045)
     Card ink at the same 4.5% alpha, so it tracks `ink` above, not `exact`. */
  gridLine: 'rgba(43,40,51,.045)',

  /* --grid-cell · 28px — the background grid pitch. */
  gridCell: '28px',

  /* --tracking-label · 0.06em — mono eyebrow/label tracking. */
  trackingLabel: '.06em',
  /* Footer meta sits a notch tighter than a label; no global.css equivalent. */
  trackingMeta: '.04em',
  /* --tracking-display is -0.045em; the card title runs slightly looser at the
     large sizes it uses, and the default card overrides back to -.045em. */
  trackingTitle: '-.035em',
  trackingDisplay: '-.045em',

  /* Card chrome — no global.css equivalent, these are card-only geometry. */
  rule: '10px',            // accent bar along the bottom edge
  padding: '64px 76px',
};

/* Card geometry. The 1200×630 is Open Graph's canonical size — LinkedIn,
   X and Slack all crop against it. */
export const CANVAS = { width: 1200, height: 630 };
