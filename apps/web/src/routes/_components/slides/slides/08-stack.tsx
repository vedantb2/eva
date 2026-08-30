import { use } from "react";
import {
  SlideShell,
  SlideKicker,
  SlideStagger,
  SlideItem,
  SlideReveal,
  SlideStepContext,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

const STACK = [
  { name: "React + Vite", desc: "Frontend" },
  { name: "Convex", desc: "Real-time backend" },
  { name: "Vercel", desc: "Sandboxes" },
  { name: "Clerk", desc: "Auth" },
  { name: "GitHub App", desc: "Repo access" },
];

export function Slide08Stack() {
  const step = use(SlideStepContext);

  return (
    <SlideShell>
      <SlideKicker>Tech stack</SlideKicker>
      <BlurWordsTitle lines={["Built on modern", "infrastructure."]} />

      {step >= 1 && (
        <SlideStagger className="mt-10 grid grid-cols-5 gap-4">
          {STACK.map((s) => (
            <SlideItem key={s.name}>
              <div className="rounded-2xl bg-surface-secondary/60 p-4 text-center">
                <p className="font-medium text-foreground">{s.name}</p>
                <p className="mt-1 text-xs text-muted">{s.desc}</p>
              </div>
            </SlideItem>
          ))}
        </SlideStagger>
      )}

      {step >= 2 && (
        <SlideReveal step={2} className="mt-8">
          <p className="text-center text-lg font-medium text-foreground">
            MIT open source
          </p>
        </SlideReveal>
      )}
    </SlideShell>
  );
}
