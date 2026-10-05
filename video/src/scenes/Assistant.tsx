import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Card, Kicker, Plate } from "../primitives";
import { enter, progress, typed, useSpringAt } from "../lib/anim";
import { S, type Lang } from "../strings";

const Q_AT = 30;
const SEARCH_AT = 92; // sources light up one after another
const A_AT = 140;
const CITE_AT = 205;
const HIT = 1; // "Events policy"

export const Assistant: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = S[lang].assistant;
  const frame = useCurrentFrame();
  const src = useSpringAt(4);
  const chat = useSpringAt(12);
  const a = useSpringAt(A_AT);
  const cite = useSpringAt(CITE_AT);

  /* A scanning highlight passes over every source, then settles on the hit. */
  const sweep = Math.floor((frame - SEARCH_AT) / 9);
  const active = (i: number): number => {
    if (frame < SEARCH_AT) return 0;
    if (frame < A_AT) return sweep % 4 === i ? 0.6 : 0;
    return i === HIT ? 1 : 0;
  };

  return (
    <Plate>
      {/* Sources */}
      <div style={{ position: "absolute", left: 60, top: 96, width: 380, ...enter(src) }}>
        <Kicker size={20} style={{ marginBottom: 18 }}>{t.sources}</Kicker>
        {t.docs.map((d, i) => (
          <Card
            key={d}
            highlight={active(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "20px 22px",
              marginBottom: 16,
              opacity: progress(frame, 6 + i * 6, 12),
              transform: `translateX(${active(i) * 12}px)`,
            }}
          >
            <svg width="34" height="40" viewBox="0 0 34 40" style={{ flex: "none" }}>
              <path d="M3 3h19l9 9v25H3z" fill={active(i) ? C.accentSoft : C.surface} stroke={active(i) ? C.accent : C.borderStrong} strokeWidth={2.5} strokeLinejoin="round" />
              <path d="M9 20h16M9 26h16M9 32h10" stroke={active(i) ? C.accent : C.borderStrong} strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 25, color: C.ink }}>{d}</span>
          </Card>
        ))}
      </div>

      {/* Chat */}
      <Card style={{ position: "absolute", left: 500, top: 80, width: 640, height: 620, padding: 34, ...enter(chat) }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              maxWidth: 500,
              padding: "20px 24px",
              borderRadius: 22,
              borderTopRightRadius: 6,
              background: C.surface,
              color: C.ink,
              fontSize: 27,
              lineHeight: 1.4,
              minHeight: 40,
              opacity: progress(frame, Q_AT - 4, 6),
            }}
          >
            {typed(t.q, frame, Q_AT, 46)}
          </div>
        </div>

        {frame >= SEARCH_AT && frame < A_AT && (
          <div style={{ display: "flex", gap: 10, marginTop: 34 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 14, background: C.accent, opacity: 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.2 + i * 0.8)) }} />
            ))}
          </div>
        )}

        {frame >= A_AT && (
          <div style={{ marginTop: 30, ...enter(a, 16) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accent }} />
              <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: C.ink }}>AI</span>
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.45, color: C.ink, minHeight: 130 }}>{typed(t.a, frame, A_AT + 4, 56)}</div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginTop: 22,
                padding: "10px 18px",
                borderRadius: 10,
                background: C.accentSoft,
                color: C.accentStrong,
                fontFamily: F.mono,
                fontSize: 21,
                ...enter(cite, 10),
              }}
            >
              ↳ {t.cite}
            </div>
          </div>
        )}
      </Card>
    </Plate>
  );
};
