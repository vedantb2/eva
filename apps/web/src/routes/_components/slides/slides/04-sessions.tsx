import { use } from "react";
import {
  SlideShell,
  SlideKicker,
  SlideBody,
  SlideReveal,
  SlideStepContext,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

export function Slide04Sessions() {
  const step = use(SlideStepContext);

  return (
    <SlideShell>
      <SlideKicker>Sessions</SlideKicker>
      <BlurWordsTitle lines={["Long-lived", "dev environments."]} />
      <SlideBody className="mt-6 max-w-2xl">
        Describe what you're building. Eva sets up a sandbox with your app
        running — preview, logs, terminal — and you iterate together.
      </SlideBody>

      {step >= 1 && (
        <SlideReveal className="mt-10 rounded-2xl bg-surface-secondary/60 p-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-semibold text-foreground">Preview</p>
              <p className="mt-1 text-sm text-muted">See your app running</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-foreground">Logs</p>
              <p className="mt-1 text-sm text-muted">Watch what happens</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-foreground">Terminal</p>
              <p className="mt-1 text-sm text-muted">Run any command</p>
            </div>
          </div>
        </SlideReveal>
      )}
    </SlideShell>
  );
}
