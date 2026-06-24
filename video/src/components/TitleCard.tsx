import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "./tokens";

type TitleCardProps = {
  text: string;
};

/** Centered accent title card for inter-scene beats. */
export function TitleCard({ text }: TitleCardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 1 },
    from: 0,
    to: 1,
  });

  const opacity = interpolate(progress, [0, 0.4], [0, 1], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(progress, [0, 1], [0.92, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.accent,
          letterSpacing: "-0.02em",
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}
