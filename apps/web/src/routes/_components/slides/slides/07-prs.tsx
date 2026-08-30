import { use } from "react";
import {
  SlideShell,
  SlideKicker,
  SlideBody,
  SlideReveal,
  SlideStepContext,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

export function Slide07PRs() {
  const step = use(SlideStepContext);

  return (
    <SlideShell>
      <SlideKicker>GitHub flow</SlideKicker>
      <BlurWordsTitle lines={["Real PRs.", "Real review."]} />
      <SlideBody className="mt-6 max-w-2xl">
        When Eva finishes a task, it opens a PR. You review it like any other —
        code, tests, CI status. No magic. Just code you can read.
      </SlideBody>

      {step >= 1 && (
        <SlideReveal className="mt-10 rounded-2xl bg-surface-secondary/60 p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-600">✓</span>
            </div>
            <div>
              <p className="font-medium text-foreground">
                eva-bot opened a pull request
              </p>
              <p className="text-sm text-muted">
                feat: Add user avatar to profile page
              </p>
            </div>
          </div>
        </SlideReveal>
      )}
    </SlideShell>
  );
}
