"use client";

import { Badge } from "@conductor/ui";
import type { Doc } from "@conductor/backend";
import {
  IconNotes,
  IconCheck,
  IconClock,
  IconClipboardCheck,
  IconEye,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";

/** Single source of truth: matches Convex `projects.phase`. */
export type ProjectPhase = Doc<"projects">["phase"];

export const PROJECT_PHASES: ProjectPhase[] = [
  "draft",
  "finalized",
  "in_progress",
  "business_review",
  "code_review",
  "completed",
  "cancelled",
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
  finalized: {
    bg: "bg-blue-500/10",
    bar: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    label: "Finalized",
    icon: IconCheck,
  },
  in_progress: {
    bg: "bg-status-progress-bg",
    bar: "bg-status-progress-bar",
    text: "text-status-progress",
    label: "In Progress",
    icon: IconClock,
  },
  business_review: {
    bg: "bg-status-business-review-bg",
    bar: "bg-status-business-review-bar",
    text: "text-status-business-review",
    label: "Business Review",
    icon: IconClipboardCheck,
  },
  code_review: {
    bg: "bg-status-code-review-bg",
    bar: "bg-status-code-review-bar",
    text: "text-status-code-review",
    label: "Code Review",
    icon: IconEye,
  },
  completed: {
    bg: "bg-status-done-bg",
    bar: "bg-status-done-bar",
    text: "text-status-done",
    label: "Merged",
    icon: IconCircleCheck,
  },
  cancelled: {
    bg: "bg-status-cancelled-bg",
    bar: "bg-status-cancelled-bar",
    text: "text-status-cancelled",
    label: "Cancelled",
    icon: IconCircleX,
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
