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
    bg: "bg-status-progress-bg",
    cardBg: "bg-card",
    text: "text-status-progress",
    label: "Active",
    icon: IconClock,
  },
  completed: {
    bg: "bg-status-done-bg",
    cardBg: "bg-card",
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
