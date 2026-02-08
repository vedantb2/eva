"use client";

import { Badge } from "@conductor/ui";
import {
  IconNotes,
  IconCheck,
  IconClock,
  IconCircleCheck,
} from "@tabler/icons-react";

export type ProjectPhase = "draft" | "finalized" | "active" | "completed";

export const PROJECT_PHASES: ProjectPhase[] = [
  "draft",
  "finalized",
  "active",
  "completed",
];

export const phaseConfig: Record<
  ProjectPhase,
  {
    bg: string;
    cardBg: string;
    text: string;
    label: string;
    icon: typeof IconNotes;
  }
> = {
  draft: {
    bg: "bg-secondary",
    cardBg: "bg-card",
    text: "text-muted-foreground",
    label: "Draft",
    icon: IconNotes,
  },
  finalized: {
    bg: "bg-accent",
    cardBg: "bg-card",
    text: "text-primary",
    label: "Finalized",
    icon: IconCheck,
  },
  active: {
    bg: "bg-yellow-200 dark:bg-yellow-900/60",
    cardBg: "bg-card",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Active",
    icon: IconClock,
  },
  completed: {
    bg: "bg-green-200 dark:bg-green-900/60",
    cardBg: "bg-card",
    text: "text-green-700 dark:text-green-400",
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
