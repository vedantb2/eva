import { cn } from "@conductor/ui";
import {
  IconGitPullRequest,
  IconLayoutKanban,
  IconTerminal2,
} from "@tabler/icons-react";

const WORKFLOW_STEPS = [
  {
    icon: IconLayoutKanban,
    num: "01",
    label: "Plan",
    detail: "Tasks & specs",
    featured: false,
  },
  {
    icon: IconTerminal2,
    num: "02",
    label: "Execute",
    detail: "Sandbox & chat",
    featured: true,
  },
  {
    icon: IconGitPullRequest,
    num: "03",
    label: "Ship",
    detail: "PRs & proof",
    featured: false,
  },
] as const;

export function LandingWorkflowStrip() {
  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:gap-2">
      {WORKFLOW_STEPS.map((step) => {
        const Icon = step.icon;
        return (
          <li key={step.label} className="flex flex-1">
            <div
              className={cn(
                "flex w-full items-start gap-3 rounded-surface p-3 transition-[background-color] sm:p-3.5",
                step.featured
                  ? "bg-primary/8 ring-1 ring-primary/15"
                  : "bg-muted/40 hover:bg-muted/55",
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  step.featured ? "bg-primary/15" : "bg-muted/60",
                )}
              >
                <Icon
                  size={15}
                  className={
                    step.featured ? "text-primary" : "text-foreground/70"
                  }
                  aria-hidden
                />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/75">
                  {step.num}
                </p>
                <p className="text-xs font-medium text-foreground">
                  {step.label}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {step.detail}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
