"use client";

import { Badge } from "@conductor/ui";
import {
  IconNotes,
  IconCheck,
  IconClock,
  IconCircleCheck,
} from "@tabler/icons-react";

export type ProjectPhase = "draft" | "finalised" | "active" | "completed";

export const PROJECT_PHASES: ProjectPhase[] = [
  "draft",
  "finalised",
  "active",
  "completed",
];

export const phaseConfig: Record<
  ProjectPhase,
  {
    bg: string;
    bar: string;
    text: string;
    label: string;
    icon: typeof IconNotes;
  }
> = {
  draft: {
    bg: "bg-secondary",
    bar: "bg-muted-foreground/50",
    text: "text-muted-foreground",
    label: "Draft",
    icon: IconNotes,
  },
  finalised: {
    bg: "bg-accent",
    bar: "bg-primary",
    text: "text-primary",
    label: "Finalised",
    icon: IconCheck,
  },
  active: {
    bg: "bg-status-progress-bg",
    bar: "bg-status-progress-bar",
    text: "text-status-progress",
    label: "Active",
    icon: IconClock,
  },
  completed: {
    bg: "bg-status-done-bg",
    bar: "bg-status-done-bar",
    text: "text-status-done",
    label: "Completed",
    icon: IconCircleCheck,
  },
};

interface ProjectPhaseBadgeProps {
  phase: ProjectPhase;
}

export function ProjectPhaseBadge({ phase }: ProjectPhaseBadgeProps) {
  const config = phaseConfig[phase];
  const Icon = config.icon;

  return (
    <Badge className={`${config.text} ${config.bg} border-transparent`}>
      <Icon size={14} className={`mr-1 ${config.text}`} />
      {config.label}
    </Badge>
  );
}
