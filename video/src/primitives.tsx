import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { loopOpacity } from "./lib/anim";

/** The site's graph-paper plate, with the scene faded in/out on top of it. */
export const Plate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.surface,
        backgroundImage: `repeating-linear-gradient(to right, ${C.grid} 0 1px, transparent 1px 32px),
          repeating-linear-gradient(to bottom, ${C.grid} 0 1px, transparent 1px 32px)`,
        fontFamily: F.sans,
        color: C.text,
      }}
    >
      <AbsoluteFill style={{ opacity: loopOpacity(frame) }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  highlight?: number;
}> = ({ children, style, highlight = 0 }) => (
  <div
    style={{
      background: C.bg,
      borderRadius: 22,
      border: `2px solid ${highlight > 0 ? `rgba(109, 90, 230, ${0.15 + highlight * 0.7})` : C.border}`,
      boxShadow: C.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Kicker: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color = C.accent,
  size = 22,
  style,
}) => (
  <div
    style={{
      fontFamily: F.mono,
      fontSize: size,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Check: React.FC<{ size?: number; color?: string; bg?: string }> = ({
  size = 40,
  color = "#fff",
  bg = C.accent,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
    }}
  >
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.2 4.2L19 7" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/** A page with ruled lines — the generic "document" glyph. */
export const DocGlyph: React.FC<{ w: number; h: number; title: string; lines?: number; style?: React.CSSProperties; highlight?: number }> = ({
  w,
  h,
  title,
  lines = 6,
  style,
  highlight = 0,
}) => (
  <Card highlight={highlight} style={{ width: w, height: h, padding: 22, borderRadius: 16, ...style }}>
    <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: C.ink, marginBottom: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {title}
    </div>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        style={{
          height: 10,
          borderRadius: 5,
          background: i === 0 ? C.accentSoft : C.surface,
          width: `${[92, 70, 84, 60, 78, 50, 66, 88][i % 8]}%`,
          marginBottom: 12,
        }}
      />
    ))}
  </Card>
);

export const Pill: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; solid?: boolean }> = ({
  children,
  style,
  solid,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 22px",
      borderRadius: 999,
      background: solid ? C.accent : C.bg,
      color: solid ? "#fff" : C.ink,
      border: solid ? "none" : `2px solid ${C.borderStrong}`,
      fontFamily: F.mono,
      fontSize: 22,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);
