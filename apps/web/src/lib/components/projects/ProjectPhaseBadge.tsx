"use client";

import { Badge, StatusDot, type StatusTone } from "@eva/ui";
import type { Doc } from "@eva/backend";
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

/** Phases a user can manually switch to via the status dropdown.
 *  Excludes draft/finalized — those are driven by the planning/interview flow. */
export const ACTIVE_PROJECT_PHASES: ProjectPhase[] = [
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
    cardBg: string;
    bar: string;
    text: string;
    label: string;
    icon: typeof IconNotes;
  }
> = {
  draft: {
    bg: "bg-secondary",
    cardBg: "bg-secondary/40",
    bar: "bg-muted-foreground/50",
    text: "text-muted-foreground",
    label: "Draft",
    icon: IconNotes,
  },
  // No status token covers "finalized", so it borrows the blue slot of the
  // muted categorical ramp — which flips with the appearance, unlike the raw
  // blue-500/blue-400 pair this replaces.
  finalized: {
    bg: "bg-cat-1/10",
    cardBg: "bg-cat-1/5",
    bar: "bg-cat-1",
    text: "text-cat-1",
    label: "Finalized",
    icon: IconCheck,
  },
  in_progress: {
    bg: "bg-status-progress-bg",
    cardBg: "bg-status-progress-subtle/40",
    bar: "bg-status-progress-bar",
    text: "text-status-progress",
    label: "In Progress",
    icon: IconClock,
  },
  business_review: {
    bg: "bg-status-business-review-bg",
    cardBg: "bg-status-business-review-subtle/40",
    bar: "bg-status-business-review-bar",
    text: "text-status-business-review",
    label: "Business Review",
    icon: IconClipboardCheck,
  },
  code_review: {
    bg: "bg-status-code-review-bg",
    cardBg: "bg-status-code-review-subtle/40",
    bar: "bg-status-code-review-bar",
    text: "text-status-code-review",
    label: "Code Review",
    icon: IconEye,
  },
  completed: {
    bg: "bg-status-done-bg",
    cardBg: "bg-status-done-subtle/40",
    bar: "bg-status-done-bar",
    text: "text-status-done",
    label: "Merged",
    icon: IconCircleCheck,
  },
  cancelled: {
    bg: "bg-status-cancelled-bg",
    cardBg: "bg-status-cancelled-subtle/40",
    bar: "bg-status-cancelled-bar",
    text: "text-status-cancelled",
    label: "Cancelled",
    icon: IconCircleX,
  },
};

interface ProjectPhaseBadgeProps {
  phase: ProjectPhase;
}

/** Linear-style status glyph per phase — the dot carries the colour, the label
 *  next to it stays neutral. "finalized" has no distinct status colour of its
 *  own, so it reads as neutral like "draft"; the label is what tells them
 *  apart. `phaseConfig.icon` is still used by the phase dropdown and the
 *  kanban, just not here — a dot, an icon and a label is one glyph too many. */
const TONE_BY_PHASE: Record<ProjectPhase, StatusTone> = {
  draft: "neutral",
  finalized: "neutral",
  in_progress: "progress",
  business_review: "business-review",
  code_review: "code-review",
  completed: "done",
  cancelled: "cancelled",
};

export function ProjectPhaseBadge({ phase }: ProjectPhaseBadgeProps) {
  return (
    <Badge variant="quiet" className="gap-1.5">
      <StatusDot tone={TONE_BY_PHASE[phase]} />
      {phaseConfig[phase].label}
    </Badge>
  );
}
