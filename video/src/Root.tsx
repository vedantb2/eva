import { Composition } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { QuickTasksDemo } from "./QuickTasksDemo";
import { EvaHero, TOTAL_FRAMES } from "./EvaHero";
import { SessionsDemo, SESSIONS_TOTAL_FRAMES } from "./SessionsDemo";

loadFont();

// Legacy 720p Quick Tasks demo timings.
const QUICK_TASKS_FRAMES = 1065;

export function Root() {
  return (
    <>
      <Composition
        id="EvaHero"
        component={EvaHero}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{}}
      />
      <Composition
        id="SessionsDemo"
        component={SessionsDemo}
        durationInFrames={SESSIONS_TOTAL_FRAMES}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{}}
      />
      <Composition
        id="QuickTasksDemo"
        component={QuickTasksDemo}
        durationInFrames={QUICK_TASKS_FRAMES}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{}}
      />
    </>
  );
}
