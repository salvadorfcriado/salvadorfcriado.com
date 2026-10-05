import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Card, Check, Kicker, Pill, Plate } from "../primitives";
import { EASE_IN_OUT, enter, progress, useSpringAt } from "../lib/anim";
import { S, type Lang } from "../strings";

const STAGE_AT = [20, 48, 76, 104];
const CLOUD_AT = 128;
const METRIC_AT = 150;
const CHIPS_AT = 205;

const Stage: React.FC<{ label: string; p: number; done: boolean; last: boolean }> = ({ label, p, done, last }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: 150 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 64,
          border: `3px solid ${p > 0 ? C.accent : C.borderStrong}`,
          background: done ? C.accent : C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${1 + 0.12 * Math.sin(Math.PI * Math.min(1, p))})`,
        }}
      >
        {done ? <Check size={44} /> : <div style={{ width: 16, height: 16, borderRadius: 16, background: p > 0 ? C.accent : C.borderStrong }} />}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 21, color: p > 0 ? C.ink : C.text, letterSpacing: "0.04em" }}>{label}</div>
    </div>
    {!last && (
      <div style={{ width: 90, height: 6, borderRadius: 3, background: C.border, marginBottom: 40, overflow: "hidden" }}>
        <div style={{ width: `${(done ? 1 : 0) * 100}%`, height: "100%", background: C.accent }} />
      </div>
    )}
  </div>
);

export const Infra: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = S[lang].infra;
  const frame = useCurrentFrame();
  const pipe = useSpringAt(4);
  const cloud = useSpringAt(CLOUD_AT - 6);
  const metric = useSpringAt(METRIC_AT);
  const swap = progress(frame, METRIC_AT + 26, 20, EASE_IN_OUT);

  return (
    <Plate>
      {/* Pipeline */}
      <Card style={{ position: "absolute", left: 60, top: 70, width: 1080, padding: "34px 40px 26px", display: "flex", justifyContent: "center", ...enter(pipe) }}>
        {t.stages.map((s, i) => {
          const p = progress(frame, STAGE_AT[i], 14);
          const done = frame >= STAGE_AT[i] + 20;
          return <Stage key={s} label={s} p={p} done={done} last={i === t.stages.length - 1} />;
        })}
      </Card>

      {/* Cloud with two environments */}
      <Card style={{ position: "absolute", left: 60, top: 300, width: 560, padding: "28px 30px", ...enter(cloud) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="46" height="32" viewBox="0 0 46 32">
            <path d="M12 30a10 10 0 01-1-20 13 13 0 0124 3 8.5 8.5 0 011 17z" fill={C.accentSoft} stroke={C.accent} strokeWidth={2.5} />
          </svg>
          <Kicker size={20}>{t.cloud}</Kicker>
        </div>
        {t.envs.map((env, e) => (
          <div key={env} style={{ marginTop: 18 }}>
            <div style={{ fontSize: 22, color: C.ink, marginBottom: 10 }}>{env}</div>
            <div style={{ display: "flex", gap: 10 }}>
              {Array.from({ length: 8 }).map((_, i) => {
                const lit = progress(frame, CLOUD_AT + e * 14 + i * 4, 8);
                const pulse = frame > 200 ? 0.75 + 0.25 * Math.sin(frame * 0.15 + i + e * 2) : 1;
                return (
                  <div
                    key={i}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      border: `2px solid ${lit > 0.5 ? C.accentLine : C.border}`,
                      background: lit > 0.5 ? C.accentSoft : C.surface,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: 10, background: C.accent, opacity: lit * pulse }} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      {/* Metric */}
      <Card style={{ position: "absolute", left: 660, top: 300, width: 480, padding: "28px 32px", height: 302, ...enter(metric) }}>
        <Kicker size={20}>{t.deployLabel}</Kicker>
        <div style={{ position: "relative", height: 120, marginTop: 22 }}>
          <div
            style={{
              position: "absolute",
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 76,
              letterSpacing: "-0.04em",
              color: C.text,
              opacity: 1 - swap,
              textDecoration: "line-through",
              transform: `translateY(${-swap * 30}px)`,
            }}
          >
            {t.before}
          </div>
          <div
            style={{
              position: "absolute",
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 76,
              letterSpacing: "-0.04em",
              color: C.accent,
              opacity: swap,
              transform: `translateY(${(1 - swap) * 30}px)`,
            }}
          >
            {t.after}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60, marginTop: 10 }}>
          {Array.from({ length: 14 }).map((_, i) => {
            const h = interpolate(i, [0, 13], [54, 8]);
            const p = progress(frame, METRIC_AT + 30 + i * 3, 10);
            return <div key={i} style={{ flex: 1, height: h * p + 2, borderRadius: 4, background: i > 9 ? C.accent : C.accentLine }} />;
          })}
        </div>
      </Card>

      <div style={{ position: "absolute", left: 60, top: 650, display: "flex", gap: 14 }}>
        {t.chips.map((c, i) => (
          <Pill key={c} style={enter(progress(frame, CHIPS_AT + i * 8, 16), 14)}>{c}</Pill>
        ))}
      </div>
    </Plate>
  );
};
