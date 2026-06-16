import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, RADIUS, PADDING } from "./tokens";

type KenBurnsProps = {
  src: string;
  /** Pan direction: "right" pans left→right, "left" pans right→left, "none" = no pan */
  panDirection?: "right" | "left" | "none";
  /** Total frames this scene lasts (used to compute interpolation end) */
  durationInFrames: number;
};

/**
 * Renders a screenshot with a slow Ken Burns zoom (1.0→1.06) and optional pan.
 * Image is centered with PADDING margin, rounded corners, hairline border, soft shadow.
 */
export function KenBurns({
  src,
  panDirection = "right",
  durationInFrames,
}: KenBurnsProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const progress = frame / Math.max(durationInFrames - 1, 1);

  const scale = interpolate(progress, [0, 1], [1.0, 1.06]);

  const panAmount = 12; // px at 1x scale
  const translateX =
    panDirection === "right"
      ? interpolate(progress, [0, 1], [0, panAmount])
      : panDirection === "left"
        ? interpolate(progress, [0, 1], [panAmount, 0])
        : 0;

  const imgWidth = width - PADDING * 2;
  const imgHeight = height - PADDING * 2;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: imgWidth,
          height: imgHeight,
          borderRadius: RADIUS,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translateX(${translateX}px)`,
            display: "block",
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
