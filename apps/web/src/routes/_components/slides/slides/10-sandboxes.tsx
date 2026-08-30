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

const FEATURES = [
  "Full Linux environment",
  "Your dependencies installed",
  "Your tests run",
  "Ephemeral — gone when done",
];

export function Slide10Sandboxes() {
  const step = use(SlideStepContext);

  return (
    <SlideShell>
      <SlideKicker>Sandboxes</SlideKicker>
      <BlurWordsTitle lines={["Isolated execution", "for every task."]} />
      <SlideBody className="mt-6 max-w-2xl">
        Each task or session gets its own isolated environment. Your code runs,
        your tests run, your app runs — then it's gone.
      </SlideBody>

      {step >= 1 && (
        <SlideStagger className="mt-10 flex flex-wrap gap-3">
          {FEATURES.map((f) => (
            <SlideItem key={f}>
              <span className="inline-flex items-center rounded-full bg-surface-secondary px-4 py-2 text-sm font-medium text-foreground/80">
                {f}
              </span>
            </SlideItem>
          ))}
        </SlideStagger>
      )}
    </SlideShell>
  );
}
