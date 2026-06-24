import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { COLORS, RADIUS, PADDING } from "./tokens";
import { Caption } from "./Caption";

type CreateSceneProps = {
  durationInFrames: number;
};

// Clip timing constants (all values at 30 fps):
//   Total clip length : 18.36 s
//   startFrom         : 25 frames = 0.833 s  → skips dead air before typing begins
//   Remaining clip    : 18.36 − 0.833 = 17.527 s
//   Scene window      : 210 frames = 7 s
//   playbackRate      : 17.527 / 7 ≈ 2.504  → rounded to 2.5
//   At 2.5× the 17.527 s remaining plays in exactly 7.01 s — fits the scene.
const START_FROM_FRAMES = 25;
const PLAYBACK_RATE = 2.5;

/**
 * Plays the real create-flow screen recording, framed identically to the
 * ScreenshotScene stills: centered on the dark canvas with margin, rounded
 * corners, hairline border, and a soft shadow.
 *
 * startFrom skips ~0.8 s of dead air so the recording begins as the modal
 * opens. playbackRate 2.5× ensures the full open→type→Create flow fits
 * within the 7 s (210-frame) scene window.
 */
export function CreateScene({
  durationInFrames: _durationInFrames,
}: CreateSceneProps) {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: COLORS.background,
      }}
    >
      <div
        style={{
          width: `calc(100% - ${PADDING * 2}px)`,
          height: `calc(100% - ${PADDING * 2}px)`,
          borderRadius: RADIUS,
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <OffthreadVideo
          src={staticFile("captures/create-flow.webm")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          startFrom={START_FROM_FRAMES}
          playbackRate={PLAYBACK_RATE}
        />
      </div>

      <Caption text="New Task → describe → ship" startFrame={10} />
    </AbsoluteFill>
  );
}
