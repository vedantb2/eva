"use client";

import { cn } from "@/lib/utils/cn";

type PlanState = "draft" | "finalized" | "feature_created";

interface PlanStatusBadgeProps {
  state: PlanState;
  size?: "sm" | "md";
  className?: string;
}

const stateConfig: Record<
  PlanState,
  { bg: string; text: string; dot: string; label: string }
> = {
  draft: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    dot: "bg-yellow-500",
    label: "Draft",
  },
  finalized: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    label: "Finalized",
  },
  feature_created: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
    label: "Feature Created",
  },
};

export function PlanStatusBadge({
  state,
  size = "sm",
  className,
}: PlanStatusBadgeProps) {
  const config = stateConfig[state];

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
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
