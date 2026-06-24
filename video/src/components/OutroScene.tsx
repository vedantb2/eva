import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "./tokens";

export function OutroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 1 },
    from: 0,
    to: 1,
  });

  const taglineProgress = spring({
    frame: frame - 12,
    fps,
    config: { damping: 18, stiffness: 110 },
    from: 0,
    to: 1,
  });

  const wordmarkProgress = spring({
    frame: frame - 22,
    fps,
    config: { damping: 20, stiffness: 120 },
    from: 0,
    to: 1,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 72,
          fontWeight: 700,
          color: COLORS.foreground,
          letterSpacing: "-0.02em",
          opacity: interpolate(headlineProgress, [0, 0.4], [0, 1], {
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(headlineProgress, [0, 1], [32, 0])}px)`,
          textAlign: "center",
        }}
      >
        Quick Tasks
      </div>

      <div
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 400,
          color: COLORS.foregroundMuted,
          opacity: interpolate(taglineProgress, [0, 0.5], [0, 1], {
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(taglineProgress, [0, 1], [16, 0])}px)`,
          textAlign: "center",
        }}
      >
        Small fixes. Zero overhead.
      </div>

      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: COLORS.accent,
          opacity: interpolate(wordmarkProgress, [0, 0.5], [0, 1], {
            extrapolateRight: "clamp",
          }),
          marginTop: 16,
        }}
      >
        eva
      </div>
    </AbsoluteFill>
  );
}
