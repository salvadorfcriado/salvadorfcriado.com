import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Card, Check, Kicker, Plate } from "../primitives";
import { enter, progress, typed, useSpringAt } from "../lib/anim";
import { S, type Lang } from "../strings";

const BRIEF_AT = 14;
const BLOCK_AT = 70; // one block every 12 frames
const APP_AT = 140;
const ALERT_AT = 205;
const SENT_AT = 228;

export const Custom: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = S[lang].custom;
  const frame = useCurrentFrame();
  const brief = useSpringAt(4);
  const app = useSpringAt(APP_AT);
  const alert = useSpringAt(ALERT_AT);

  return (
    <Plate>
      {/* The brief */}
      <Card style={{ position: "absolute", left: 50, top: 90, width: 330, padding: "28px 28px", ...enter(brief) }}>
        <Kicker size={19}>{t.need}</Kicker>
        <div style={{ marginTop: 16, fontSize: 27, lineHeight: 1.45, color: C.ink, minHeight: 230 }}>
          “{typed(t.brief, frame, BRIEF_AT, 46)}”
        </div>
      </Card>

      {/* Building blocks */}
      <div style={{ position: "absolute", left: 420, top: 90, width: 210 }}>
        <Kicker size={19} style={{ opacity: progress(frame, BLOCK_AT - 10, 10), marginBottom: 14 }}>{t.building}</Kicker>
        {t.blocks.map((b, i) => {
          const p = progress(frame, BLOCK_AT + i * 12, 14);
          const live = frame > APP_AT + i * 4;
          return (
            <div
              key={b}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "16px 18px", marginBottom: 12, borderRadius: 14,
                background: live ? C.accent : C.bg,
                color: live ? "#fff" : C.ink,
                border: `2px solid ${live ? C.accent : C.border}`,
                boxShadow: C.shadow, fontSize: 24, fontWeight: 600, fontFamily: F.display,
                opacity: p, transform: `translateX(${(1 - p) * -40}px)`,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 4, background: live ? "#fff" : C.accent }} />
              {b}
            </div>
          );
        })}
      </div>

      {/* The shipped app */}
      <Card style={{ position: "absolute", left: 670, top: 70, width: 480, overflow: "hidden", ...enter(app) }}>
        <div style={{ display: "flex", gap: 8, padding: "14px 18px", background: C.surface, borderBottom: `2px solid ${C.border}` }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 12, background: C.borderStrong }} />)}
        </div>
        <div style={{ padding: "22px 26px 26px" }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30, color: C.ink }}>{t.app}</div>
          {t.projects.map(([name, pct], i) => {
            const fill = progress(frame, APP_AT + 14 + i * 10, 30) * (pct as number);
            const warn = i === 1 && frame >= ALERT_AT;
            return (
              <div key={name as string} style={{ marginTop: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: C.ink }}>
                  <span>{name}</span>
                  <span style={{ fontFamily: F.mono, color: warn ? C.accentStrong : C.text }}>{Math.round(fill)}%</span>
                </div>
                <div style={{ marginTop: 8, height: 12, borderRadius: 8, background: C.surface, overflow: "hidden" }}>
                  <div style={{ width: `${fill}%`, height: "100%", borderRadius: 8, background: warn ? C.accentStrong : C.accent }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1, height: 70, borderRadius: 10, background: `linear-gradient(135deg, ${C.accentSoft}, ${C.surface})`, border: `2px solid ${C.border}`, opacity: progress(frame, APP_AT + 40 + i * 6, 10) }} />
            ))}
          </div>
        </div>
      </Card>

      {/* Alert → notification */}
      <div style={{ position: "absolute", left: 670, top: 590, width: 480, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 12, background: C.accentSoft, border: `2px solid ${C.accentLine}`, color: C.accentStrong, fontFamily: F.mono, fontSize: 21, ...enter(alert, 12) }}>
          ⚠ {t.alert}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: F.display, fontWeight: 600, fontSize: 26, color: C.ink, ...enter(progress(frame, SENT_AT, 14), 12) }}>
          <Check size={36} /> {t.sent}
        </div>
      </div>
    </Plate>
  );
};
