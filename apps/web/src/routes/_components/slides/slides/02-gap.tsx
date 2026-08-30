import { use } from "react";
import {
  SlideShell,
  SlideKicker,
  SlideStagger,
  SlideItem,
  SlideStepContext,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

const PROBLEMS = [
  {
    label: "Context",
    desc: "Agents need your codebase, style guide, and CI — not a blank prompt.",
  },
  {
    label: "Execution",
    desc: "They need to run commands, not just generate text.",
  },
  {
    label: "Review",
    desc: "You need to see the diff, not trust a summary.",
  },
];

export function Slide02Gap() {
  const step = use(SlideStepContext);

  return (
    <SlideShell>
      <SlideKicker>The gap</SlideKicker>
      <BlurWordsTitle lines={["AI demos vs.", "real engineering work."]} />

      {step >= 1 && (
        <SlideStagger className="mt-12 grid grid-cols-3 gap-8">
          {PROBLEMS.map((p) => (
            <SlideItem key={p.label}>
              <div className="rounded-2xl bg-surface-secondary/60 p-6">
                <p className="text-lg font-medium text-foreground">{p.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {p.desc}
                </p>
              </div>
            </SlideItem>
          ))}
        </SlideStagger>
      )}
    </SlideShell>
  );
}
