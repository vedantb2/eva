import { use } from "react";
import {
  SlideShell,
  SlideKicker,
  SlideBody,
  SlideStagger,
  SlideItem,
  SlideStepContext,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

const PHASES = ["Define the spec", "Break into phases", "Execute & track"];

export function Slide05Projects() {
  const step = use(SlideStepContext);

  return (
    <SlideShell>
      <SlideKicker>Projects</SlideKicker>
      <BlurWordsTitle lines={["Larger features,", "planned and tracked."]} />
      <SlideBody className="mt-6 max-w-2xl">
        For work that spans multiple sessions or tasks. A product spec, broken
        into phases, executed piece by piece.
      </SlideBody>

      {step >= 1 && (
        <SlideStagger className="mt-10 flex gap-6">
          {PHASES.map((phase, i) => (
            <SlideItem key={phase}>
              <div className="flex items-center gap-4 rounded-2xl bg-surface-secondary/60 px-6 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-sm font-medium">
                  {i + 1}
                </span>
                <p className="text-base font-medium text-foreground">{phase}</p>
              </div>
            </SlideItem>
          ))}
        </SlideStagger>
      )}
    </SlideShell>
  );
}
