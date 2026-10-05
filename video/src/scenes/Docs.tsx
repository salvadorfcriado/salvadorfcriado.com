import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Card, Check, DocGlyph, Kicker, Plate } from "../primitives";
import { EASE_IN_OUT, enter, progress, typed, useSpringAt } from "../lib/anim";
import { S, type Lang } from "../strings";

const PICK = 30; // the delivery note slides into the reader
const SCAN = [60, 60] as const; // start, duration
const FIELDS_AT = 80;

export const Docs: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = S[lang].docs;
  const frame = useCurrentFrame();
  const stack = useSpringAt(4);
  const pick = progress(frame, PICK, 26, EASE_IN_OUT);
  const scanning = frame >= SCAN[0] && frame < SCAN[0] + SCAN[1];
  const scanY = interpolate((frame - SCAN[0]) % 40, [0, 40], [0, 1]);
  const panel = useSpringAt(FIELDS_AT - 10);
  const saved = useSpringAt(196);
  const review = useSpringAt(214);

  return (
    <Plate>
      {/* Inbox stack: invoice, delivery note, contract */}
      {t.inbox.map((name, i) => {
        const isPicked = i === 1;
        const baseX = 60 + i * 26;
        const baseY = 110 + i * 26;
        const x = isPicked ? interpolate(pick, [0, 1], [baseX, 140]) : baseX;
        const y = isPicked ? interpolate(pick, [0, 1], [baseY, 190]) : baseY;
        const s = isPicked ? interpolate(pick, [0, 1], [0.78, 1]) : 0.78;
        const others = isPicked ? 1 : 1 - pick * 0.55;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `scale(${s}) rotate(${isPicked ? (1 - pick) * -3 : (i - 1) * 3}deg)`,
              transformOrigin: "top left",
              zIndex: isPicked ? 5 : i,
              opacity: others * Math.min(1, stack * 1.4),
            }}
          >
            <DocGlyph w={380} h={480} title={name} lines={15} highlight={isPicked ? progress(frame, SCAN[0], 10) : 0} />
          </div>
        );
      })}

      {/* Scanning beam over the picked document */}
      {scanning && (
        <div
          style={{
            position: "absolute",
            left: 130,
            top: 190 + scanY * 470,
            width: 400,
            height: 6,
            borderRadius: 3,
            background: C.accent,
            boxShadow: `0 0 30px 8px ${C.accentLine}`,
            zIndex: 10,
          }}
        />
      )}
      {frame >= SCAN[0] - 6 && frame < 200 && (
        <div style={{ position: "absolute", left: 140, top: 128, zIndex: 10, opacity: progress(frame, SCAN[0] - 6, 10) * (1 - progress(frame, 186, 12)) }}>
          <Kicker size={20}>{t.reading}…</Kicker>
        </div>
      )}

      {/* Arrow */}
      <svg
        width="90"
        height="40"
        viewBox="0 0 90 40"
        style={{ position: "absolute", left: 560, top: 400, opacity: progress(frame, FIELDS_AT - 14, 12) }}
      >
        <path d="M4 20h72M62 6l16 14-16 14" stroke={C.accent} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Extracted fields */}
      <Card style={{ position: "absolute", left: 680, top: 70, width: 460, padding: "28px 32px", ...enter(panel) }}>
        <Kicker size={20} style={{ marginBottom: 18 }}>{t.title}</Kicker>
        {t.fields.map(([k, v], i) => {
          const start = FIELDS_AT + i * 20;
          return (
            <div key={k} style={{ padding: "13px 0", borderTop: i ? `2px solid ${C.border}` : "none", opacity: progress(frame, start - 4, 8) }}>
              <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.06em", textTransform: "uppercase", color: C.text }}>{k}</div>
              <div
                style={{
                  fontSize: 27,
                  color: C.ink,
                  marginTop: 4,
                  minHeight: 36,
                  background: i === 4 && frame >= 214 ? C.accentSoft : "transparent",
                  borderRadius: 6,
                }}
              >
                {typed(v, frame, start, 16)}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Outcome */}
      <div style={{ position: "absolute", left: 680, top: 700, width: 460, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: F.display, fontWeight: 600, fontSize: 28, color: C.ink, ...enter(saved, 12) }}>
          <Check size={38} /> {t.saved}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 20, color: C.accentStrong, ...enter(review, 12) }}>{t.review}</div>
      </div>
    </Plate>
  );
};
