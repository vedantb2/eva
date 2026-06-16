import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, RADIUS, PADDING } from "./tokens";
import { Caption } from "./Caption";

/**
 * Shows list.png for ~half the scene, then slides in table.png from the right
 * (a horizontal wipe within the scene).
 */
type ListTableSceneProps = {
  durationInFrames: number;
};

export function ListTableScene({ durationInFrames }: ListTableSceneProps) {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();

  // Transition starts at ~55% through the scene
  const transitionStart = Math.floor(durationInFrames * 0.52);

  const slideProgress = spring({
    frame: frame - transitionStart,
    fps,
    config: { damping: 18, stiffness: 90, mass: 1.2 },
    from: 0,
    to: 1,
  });

  // table slides in from the right
  const tableTranslateX = interpolate(slideProgress, [0, 1], [width, 0]);
  // list slides out to the left
  const listTranslateX = interpolate(slideProgress, [0, 1], [0, -width]);

  const containerStyle: CSSProperties = {
    width: `calc(100% - ${PADDING * 2}px)`,
    height: `calc(100% - ${PADDING * 2}px)`,
    borderRadius: RADIUS,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
    overflow: "hidden",
    position: "absolute",
    top: PADDING,
    left: PADDING,
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* List view */}
      <div
        style={{
          ...containerStyle,
          transform: `translateX(${listTranslateX}px)`,
        }}
      >
        <img
          src={staticFile("captures/list.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      {/* Table view slides in */}
      <div
        style={{
          ...containerStyle,
          transform: `translateX(${tableTranslateX}px)`,
        }}
      >
        <img
          src={staticFile("captures/table.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <Caption text="Board · List · Table" startFrame={10} />
    </AbsoluteFill>
  );
}
