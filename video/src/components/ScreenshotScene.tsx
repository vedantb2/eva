import { AbsoluteFill } from "remotion";
import { KenBurns } from "./KenBurns";
import { Caption } from "./Caption";

type ScreenshotSceneProps = {
  src: string;
  caption?: string;
  panDirection?: "right" | "left" | "none";
  durationInFrames: number;
};

/** Screenshot with Ken Burns effect and an optional lower-third caption. */
export function ScreenshotScene({
  src,
  caption,
  panDirection,
  durationInFrames,
}: ScreenshotSceneProps) {
  return (
    <AbsoluteFill>
      <KenBurns
        src={src}
        panDirection={panDirection}
        durationInFrames={durationInFrames}
      />
      {caption && <Caption text={caption} startFrame={10} />}
    </AbsoluteFill>
  );
}
