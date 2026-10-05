import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Card, Check, Kicker, Pill, Plate } from "../primitives";
import { enter, progress, typed, useSpringAt } from "../lib/anim";
import { S, type Lang } from "../strings";

const CALLER = [24, 78] as const; // caller speaks
const BOT = [92, 160] as const; // assistant speaks

const Wave: React.FC<{ frame: number }> = ({ frame }) => {
  const callerOn = frame >= CALLER[0] && frame < CALLER[1];
  const botOn = frame >= BOT[0] && frame < BOT[1];
  const on = callerOn || botOn;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, height: 120 }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const amp = on ? 0.25 + 0.75 * Math.abs(Math.sin(frame * 0.32 + i * 0.9) * Math.cos(frame * 0.11 + i * 0.37)) : 0.08;
        return (
          <div
            key={i}
            style={{
              width: 10,
              height: 12 + amp * 100,
              borderRadius: 6,
              background: botOn ? C.accent : callerOn ? C.ink : C.borderStrong,
              opacity: on ? 0.9 : 0.6,
            }}
          />
        );
      })}
    </div>
  );
};

const Bubble: React.FC<{ who: string; text: string; bot?: boolean; style?: React.CSSProperties }> = ({ who, text, bot, style }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: bot ? "flex-end" : "flex-start", ...style }}>
    <Kicker size={18} color={bot ? C.accent : C.text} style={{ marginBottom: 8 }}>{who}</Kicker>
    <div
      style={{
        maxWidth: 560,
        padding: "20px 26px",
        borderRadius: 24,
        borderTopLeftRadius: bot ? 24 : 6,
        borderTopRightRadius: bot ? 6 : 24,
        background: bot ? C.accent : C.bg,
        color: bot ? "#fff" : C.ink,
        border: bot ? "none" : `2px solid ${C.border}`,
        fontSize: 28,
        lineHeight: 1.4,
        minHeight: 40,
        boxShadow: C.shadow,
      }}
    >
      {text}
    </div>
  </div>
);

export const Voice: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = S[lang].voice;
  const frame = useCurrentFrame();
  const phone = useSpringAt(4);
  const b1 = useSpringAt(CALLER[0]);
  const b2 = useSpringAt(BOT[0]);
  const done = useSpringAt(172);
  const chips = [0, 1, 2].map((i) => progress(frame, 205 + i * 8, 16));
  const secs = Math.max(0, Math.floor((frame - 10) / 30));
  const ring = frame < CALLER[0] ? 1 + 0.06 * Math.sin(frame * 0.6) : 1;

  return (
    <Plate>
      {/* Phone */}
      <Card style={{ position: "absolute", left: 60, top: 90, width: 420, height: 540, padding: 36, display: "flex", flexDirection: "column", alignItems: "center", ...enter(phone) }}>
        <Kicker size={20}>{t.incoming}</Kicker>
        <div
          style={{
            marginTop: 34,
            width: 132,
            height: 132,
            borderRadius: 132,
            background: C.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${ring})`,
          }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
            <path
              d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.6a1 1 0 01-.25 1z"
              fill={C.accent}
            />
          </svg>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 30, color: C.ink, marginTop: 26 }}>
          00:{String(secs).padStart(2, "0")}
        </div>
        <div style={{ marginTop: 40 }}>
          <Wave frame={frame} />
        </div>
      </Card>

      {/* Transcript */}
      <div style={{ position: "absolute", left: 530, top: 70, width: 610 }}>
        <Bubble who={t.caller} text={typed(t.q, frame, CALLER[0], CALLER[1] - CALLER[0] - 10)} style={enter(b1)} />
        {frame >= BOT[0] && (
          <Bubble who={t.assistant} text={typed(t.a, frame, BOT[0], BOT[1] - BOT[0] - 8)} bot style={{ marginTop: 26, ...enter(b2) }} />
        )}
        {frame >= 172 && (
          <Card style={{ marginTop: 30, padding: "24px 28px", display: "flex", gap: 22, alignItems: "flex-start", ...enter(done) }} highlight={1}>
            <Check size={48} />
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 32, color: C.ink }}>{t.done}</div>
              {t.rows.map((r, i) => (
                <div key={r} style={{ fontSize: 24, marginTop: 6, opacity: progress(frame, 180 + i * 8, 12) }}>{r}</div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Chips */}
      <div style={{ position: "absolute", left: 60, bottom: 54, display: "flex", gap: 14 }}>
        {t.chips.map((c, i) => (
          <Pill key={c} solid={i === 0} style={enter(chips[i], 14)}>{c}</Pill>
        ))}
      </div>
    </Plate>
  );
};
