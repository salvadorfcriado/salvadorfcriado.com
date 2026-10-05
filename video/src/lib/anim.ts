import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DURATION } from "../theme";

export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 between `start` and `start + duration`, clamped. */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE_OUT,
): number =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Spring 0→1 that starts at `delay`. */
export const useSpringAt = (delay: number, stiffness = 140, damping = 18): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { stiffness, damping, mass: 0.8 } });
};

/** Global fade: content fades in at the start and out at the end, so the first
    and last frames are the same empty plate and the clip loops without a jump. */
export const loopOpacity = (frame: number): number =>
  Math.min(progress(frame, 0, 14), 1 - progress(frame, DURATION - 24, 22, EASE_IN_OUT));

/** Entrance: opacity + rise, driven by a spring. */
export const enter = (p: number, rise = 24): React.CSSProperties => ({
  opacity: Math.min(1, p * 1.4),
  transform: `translateY(${(1 - p) * rise}px)`,
});

/** Characters of `text` revealed so far, typed between `start` and `start + duration`. */
export const typed = (text: string, frame: number, start: number, duration: number): string =>
  text.slice(0, Math.round(text.length * progress(frame, start, duration, (t) => t)));
