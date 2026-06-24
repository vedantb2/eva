import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { COLORS } from "./components/tokens";
import { TitleSlide } from "./components/TitleSlide";
import { TitleCard } from "./components/TitleCard";
import { ScreenshotScene } from "./components/ScreenshotScene";
import { CreateScene } from "./components/CreateScene";
import { ListTableScene } from "./components/ListTableScene";
import { OutroScene } from "./components/OutroScene";

const TRANSITION_FRAMES = 15;

// Scene durations in frames
const SCENE = {
  intro: 120, // 4s
  kanban: 180, // 6s
  titleCreate: 90, // 3s
  create: 210, // 7s
  titleView: 90, // 3s
  listTable: 195, // 6.5s
  detail: 165, // 5.5s
  outro: 120, // 4s
} as const;

const timing = springTiming({
  config: { damping: 18, stiffness: 120 },
  durationInFrames: TRANSITION_FRAMES,
});

export function QuickTasksDemo() {
  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      <TransitionSeries>
        {/* Scene 1: Intro */}
        <TransitionSeries.Sequence durationInFrames={SCENE.intro}>
          <TitleSlide
            eyebrow="EVA"
            headline="Quick Tasks"
            subtitle="Ship small fixes without the overhead."
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* Scene 2: Kanban */}
        <TransitionSeries.Sequence durationInFrames={SCENE.kanban}>
          <ScreenshotScene
            src="captures/kanban.png"
            caption="Every task, one board"
            panDirection="right"
            durationInFrames={SCENE.kanban}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* Scene 3: Title card — Create */}
        <TransitionSeries.Sequence durationInFrames={SCENE.titleCreate}>
          <TitleCard text="Create in seconds" />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={timing}
        />

        {/* Scene 4: Create demo */}
        <TransitionSeries.Sequence durationInFrames={SCENE.create}>
          <CreateScene durationInFrames={SCENE.create} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* Scene 5: Title card — View */}
        <TransitionSeries.Sequence durationInFrames={SCENE.titleView}>
          <TitleCard text="View it your way" />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={timing}
        />

        {/* Scene 6: List + Table */}
        <TransitionSeries.Sequence durationInFrames={SCENE.listTable}>
          <ListTableScene durationInFrames={SCENE.listTable} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* Scene 7: Detail */}
        <TransitionSeries.Sequence durationInFrames={SCENE.detail}>
          <ScreenshotScene
            src="captures/detail.png"
            caption="Drill in — then hand it to Eva"
            panDirection="left"
            durationInFrames={SCENE.detail}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        {/* Scene 8: Outro */}
        <TransitionSeries.Sequence durationInFrames={SCENE.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
