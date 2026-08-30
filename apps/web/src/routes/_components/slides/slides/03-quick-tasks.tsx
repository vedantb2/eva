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

const EXAMPLES = [
  "Fix this bug",
  "Add a test for edge case",
  "Update the copy here",
  "Refactor this function",
];

export function Slide03QuickTasks() {
  const step = use(SlideStepContext);

  return (
    <SlideShell>
      <SlideKicker>Quick tasks</SlideKicker>
      <BlurWordsTitle lines={["Small changes,", "shipped fast."]} />
      <SlideBody className="mt-6 max-w-2xl">
        Describe the work. Eva spins up an isolated sandbox, makes the change,
        and shows you the result. No boilerplate. No PR dance.
      </SlideBody>

      {step >= 1 && (
        <SlideStagger className="mt-10 flex flex-wrap gap-3">
          {EXAMPLES.map((ex) => (
            <SlideItem key={ex}>
              <span className="inline-flex items-center rounded-full bg-surface-secondary px-4 py-2 text-sm font-medium text-foreground/80">
                "{ex}"
              </span>
            </SlideItem>
          ))}
        </SlideStagger>
      )}
    </SlideShell>
  );
}
