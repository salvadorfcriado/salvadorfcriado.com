import { loadFont as loadDisplay } from "@remotion/google-fonts/InterTight";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/* The site's palette (src/styles/global.css), converted from oklch to sRGB.
   One accent, no second strong colour — success states are violet too. */
export const C = {
  bg: "#ffffff",
  surface: "#f6f6fa",
  ink: "#0f0e1d",
  text: "#5c5b70",
  accent: "#6d5ae6",
  accentStrong: "#5445b8",
  accentSoft: "rgba(109, 90, 230, 0.09)",
  accentLine: "rgba(109, 90, 230, 0.35)",
  border: "rgba(15, 14, 29, 0.09)",
  borderStrong: "rgba(15, 14, 29, 0.16)",
  grid: "rgba(15, 14, 29, 0.04)",
  shadow: "0 24px 60px -20px rgba(15, 14, 29, 0.18), 0 2px 6px rgba(15, 14, 29, 0.05)",
} as const;

const display = loadDisplay("normal", { weights: ["600", "700"], subsets: ["latin"] });
const sans = loadSans("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

export const F = {
  display: display.fontFamily,
  sans: sans.fontFamily,
  mono: mono.fontFamily,
} as const;

export const W = 1200;
export const H = 800;
export const FPS = 30;
/* Every service clip is the same length so the cards on the page breathe together. */
export const DURATION = 300;
