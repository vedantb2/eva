import { Composition } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { QuickTasksDemo } from "./QuickTasksDemo";

// Load Inter font
loadFont();

// Timings (in frames at 30fps)
// 7 transitions × 15f overlap = 105f total overlap
// Scene durations: 120+180+90+210+90+195+165+120 = 1170 − 105 = 1065f ≈ 35.5s
const TOTAL_FRAMES = 1065;

export function Root() {
  return (
    <Composition
      id="QuickTasksDemo"
      component={QuickTasksDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{}}
    />
  );
}
