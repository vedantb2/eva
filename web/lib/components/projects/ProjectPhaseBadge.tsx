"use client";

import {
  IconNotes,
  IconCheck,
  IconClock,
  IconCircleCheck,
} from "@tabler/icons-react";

type ProjectPhase = "draft" | "finalized" | "active" | "completed";

const phaseConfig: Record<
  ProjectPhase,
  { label: string; bgClass: string; textClass: string; icon: typeof IconNotes }
> = {
  draft: {
    label: "Draft",
    bgClass: "bg-neutral-100 dark:bg-neutral-700",
    textClass: "text-neutral-600 dark:text-neutral-300",
    icon: IconNotes,
  },
  finalized: {
    label: "Finalised",
    bgClass: "bg-teal-100 dark:bg-teal-900/30",
    textClass: "text-teal-700 dark:text-teal-400",
    icon: IconCheck,
  },
  active: {
    label: "Active",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
    textClass: "text-yellow-700 dark:text-yellow-400",
    icon: IconClock,
  },
  completed: {
    label: "Completed",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-400",
    icon: IconCircleCheck,
  },
};

interface ProjectPhaseBadgeProps {
  phase: ProjectPhase;
  size?: "sm" | "md";
}

export function ProjectPhaseBadge({ phase, size = "md" }: ProjectPhaseBadgeProps) {
  const config = phaseConfig[phase];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgClass} ${config.textClass} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      }`}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      {config.label}
    </span>
  );
}
