import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "./tokens";

type CaptionProps = {
  text: string;
  /** Frame within the current scene at which the caption appears */
  startFrame?: number;
};

/** Lower-third pill: indigo accent bar + text on a card, slides up + fades in */
export function Caption({ text, startFrame = 10 }: CaptionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 1 },
    from: 0,
    to: 1,
  });

  const translateY = interpolate(progress, [0, 1], [28, 0]);
  const opacity = interpolate(progress, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 40,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          opacity,
          display: "flex",
          alignItems: "center",
          gap: 0,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Indigo accent bar */}
        <div
          style={{
            width: 4,
            alignSelf: "stretch",
            background: COLORS.accent,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 20,
            fontWeight: 500,
            color: COLORS.foreground,
            padding: "12px 20px",
            letterSpacing: "0.01em",
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
}
