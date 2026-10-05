import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Card, Check, Kicker, Pill, Plate } from "../primitives";
import { enter, progress, useSpringAt } from "../lib/anim";
import { S, type Lang } from "../strings";

const ROW_AT = [20, 38, 56];
const ENTRY_AT = 90;
const LINE_AT = [110, 132, 154];
const BALANCE_AT = 182;
const EXPORT_AT = 210;

export const Billing: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = S[lang].billing;
  const frame = useCurrentFrame();
  const inbox = useSpringAt(4);
  const entry = useSpringAt(ENTRY_AT);
  const balanced = useSpringAt(BALANCE_AT);
  const exported = useSpringAt(EXPORT_AT);
  const count = Math.round(97 + 31 * progress(frame, 16, 170, (x) => x));
  const highlighted = frame >= ENTRY_AT - 10 ? 0 : -1;

  return (
    <Plate>
      {/* Inbox */}
      <Card style={{ position: "absolute", left: 60, top: 90, width: 470, padding: "30px 30px", ...enter(inbox) }}>
        <Kicker size={20}>{t.inbox}</Kicker>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 10 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 84, color: C.ink, letterSpacing: "-0.04em" }}>{count}</div>
          <div style={{ fontFamily: F.mono, fontSize: 22 }}>{t.month}</div>
        </div>
        <div style={{ marginTop: 16 }}>
          {t.suppliers.map(([name, amount], i) => {
            const p = progress(frame, ROW_AT[i], 16);
            const on = i === highlighted;
            return (
              <div
                key={name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 18px",
                  marginTop: 10,
                  borderRadius: 14,
                  background: on ? C.accentSoft : C.surface,
                  border: `2px solid ${on ? C.accentLine : "transparent"}`,
                  fontSize: 25,
                  color: C.ink,
                  opacity: p,
                  transform: `translateX(${(1 - p) * -30}px)`,
                }}
              >
                <span>{name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 23 }}>{amount}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <svg width="80" height="40" viewBox="0 0 80 40" style={{ position: "absolute", left: 552, top: 300, opacity: progress(frame, ENTRY_AT - 12, 12) }}>
        <path d="M4 20h62M52 6l16 14-16 14" stroke={C.accent} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Journal entry */}
      <Card style={{ position: "absolute", left: 640, top: 90, width: 520, padding: "30px 30px", ...enter(entry) }}>
        <Kicker size={20}>{t.entry}</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr", columnGap: 18, marginTop: 18, fontFamily: F.mono, fontSize: 17, letterSpacing: "0.06em", textTransform: "uppercase", paddingBottom: 10, borderBottom: `2px solid ${C.borderStrong}` }}>
          {t.cols.map((c, i) => (
            <div key={c} style={{ textAlign: i ? "right" : "left" }}>{c}</div>
          ))}
        </div>
        {t.lines.map(([acc, d, h], i) => {
          const p = progress(frame, LINE_AT[i], 14);
          return (
            <div
              key={acc}
              style={{
                display: "grid",
                gridTemplateColumns: "1.7fr 1fr 1fr", columnGap: 18,
                padding: "16px 0",
                borderBottom: `2px solid ${C.border}`,
                fontSize: 23,
                color: C.ink,
                opacity: p,
                transform: `translateY(${(1 - p) * 12}px)`,
              }}
            >
              <div>{acc}</div>
              <div style={{ textAlign: "right", fontFamily: F.mono, fontSize: 22 }}>{d}</div>
              <div style={{ textAlign: "right", fontFamily: F.mono, fontSize: 22 }}>{h}</div>
            </div>
          );
        })}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.7fr 1fr 1fr", columnGap: 18,
            padding: "16px 0 4px",
            fontFamily: F.mono,
            fontSize: 22,
            color: C.accentStrong,
            opacity: progress(frame, BALANCE_AT - 6, 10),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.display, fontWeight: 600, fontSize: 24 }}>
            <span style={{ transform: `scale(${balanced})`, display: "inline-flex" }}>
              <Check size={32} />
            </span>
            {t.balanced}
          </div>
          <div style={{ textAlign: "right" }}>{t.lines[2][2]}</div>
          <div style={{ textAlign: "right" }}>{t.lines[2][2]}</div>
        </div>
      </Card>

      <div style={{ position: "absolute", right: 40, top: 600, ...enter(exported, 16) }}>
        <Pill solid>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v12m0 0l-5-5m5 5l5-5M4 19h16" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.exported}
        </Pill>
      </div>
    </Plate>
  );
};
