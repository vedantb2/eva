"use client";

import { cn } from "@/lib/utils/cn";
import { IconNotes, IconCheck, IconCircleCheck } from "@tabler/icons-react";

type PlanState = "draft" | "finalized" | "feature_created";

interface PlanStatusBadgeProps {
  state: PlanState;
  size?: "sm" | "md";
  className?: string;
}

const stateConfig: Record<
  PlanState,
  { bg: string; text: string; label: string; icon: typeof IconNotes }
> = {
  draft: {
    bg: "bg-neutral-100 dark:bg-neutral-700",
    text: "text-neutral-600 dark:text-neutral-300",
    label: "Draft",
    icon: IconNotes,
  },
  finalized: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Finalized",
    icon: IconCheck,
  },
  feature_created: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Feature Created",
    icon: IconCircleCheck,
  },
};

export function PlanStatusBadge({
  state,
  size = "sm",
  className,
}: PlanStatusBadgeProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      {config.label}
    </span>
  );
}
