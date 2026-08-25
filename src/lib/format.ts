/** `2026-08-25` — the only date format the site renders, in `<time datetime>`
    and in the visible meta line. Was written out three times, untyped. */
export const isoDay = (d: Date): string => d.toISOString().slice(0, 10);
