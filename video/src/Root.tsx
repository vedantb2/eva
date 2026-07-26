import { Composition } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { QuickTasksDemo } from "./QuickTasksDemo";
import { EvaHero, TOTAL_FRAMES } from "./EvaHero";
import { SessionsDemo, SESSIONS_TOTAL_FRAMES } from "./SessionsDemo";
import { EvaPlatform, PLATFORM_TOTAL_FRAMES } from "./EvaPlatform";
import { FeatureScreencast, FeatureScreencastProps } from "./FeatureScreencast";

loadFont();

// Legacy 720p Quick Tasks demo timings.
const QUICK_TASKS_FRAMES = 1065;

const EMPTY_SCREENCAST: FeatureScreencastProps = {
  src: "recordings/example.webm",
  actions: [],
  durationInFrames: 300,
};

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
        id="EvaPlatform"
        component={EvaPlatform}
        durationInFrames={PLATFORM_TOTAL_FRAMES}
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
      {/* Zoom pass over a raw agent-browser screencast. Everything real comes in
          through --props from scripts/render-screencast.mjs, which knows the
          recording's duration; the defaults here just keep Studio openable. */}
      <Composition
        id="FeatureScreencast"
        component={FeatureScreencast}
        durationInFrames={300}
        fps={30}
        width={1280}
        height={720}
        defaultProps={EMPTY_SCREENCAST}
        calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
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
