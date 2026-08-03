"use client";

import { Badge, StatusDot, type StatusTone } from "@eva/ui";
import {
  IconCircle,
  IconClock,
  IconClipboardCheck,
  IconEye,
  IconCircleCheck,
  IconCircleX,
  IconPencil,
} from "@tabler/icons-react";

export type TaskStatus =
  | "draft"
  | "todo"
  | "in_progress"
  | "code_review"
  | "business_review"
  | "done"
  | "cancelled";

export type DisplayTaskStatus = Exclude<TaskStatus, "draft">;

export const TASK_STATUSES: DisplayTaskStatus[] = [
  "todo",
  "in_progress",
  "business_review",
  "code_review",
  "done",
  "cancelled",
];

/**
 * Position of a status in the workflow, for sorting a mixed list into pipeline
 * order (todo → … → done) instead of alphabetically. Statuses outside
 * TASK_STATUSES — only "draft" today — sort after every known one.
 */
export function statusWorkflowOrder(status: TaskStatus): number {
  const index = TASK_STATUSES.findIndex((s) => s === status);
  return index === -1 ? TASK_STATUSES.length : index;
}

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export const statusConfig: Record<
  TaskStatus,
  {
    bg: string;
    cardBg: string;
    bar: string;
    text: string;
    label: string;
    icon: typeof IconCircle;
  }
> = {
  draft: {
    bg: "bg-secondary",
    cardBg: "bg-secondary/40",
    bar: "bg-muted-foreground/50",
    text: "text-muted-foreground",
    label: "Draft",
    icon: IconPencil,
  },
  todo: {
    bg: "bg-secondary",
    cardBg: "bg-secondary/40",
    bar: "bg-foreground/50",
    text: "text-muted-foreground",
    label: "To Do",
    icon: IconCircle,
  },
  in_progress: {
    bg: "bg-status-progress-bg",
    cardBg: "bg-status-progress-subtle/40",
    bar: "bg-status-progress-bar",
    text: "text-status-progress",
    label: "In Progress",
    icon: IconClock,
  },
  code_review: {
    bg: "bg-status-code-review-bg",
    cardBg: "bg-status-code-review-subtle/40",
    bar: "bg-status-code-review-bar",
    text: "text-status-code-review",
    label: "Code Review",
    icon: IconEye,
  },
  business_review: {
    bg: "bg-status-business-review-bg",
    cardBg: "bg-status-business-review-subtle/40",
    bar: "bg-status-business-review-bar",
    text: "text-status-business-review",
    label: "Business Review",
    icon: IconClipboardCheck,
  },
  done: {
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

/** Linear-style status glyph per status — the dot carries the colour, the label
 *  next to it stays neutral. `statusConfig.icon` is still used by the status
 *  dropdown and the kanban, just not here: a dot, an icon and a label is one
 *  glyph too many for a chip this small. */
const TONE_BY_STATUS: Record<TaskStatus, StatusTone> = {
  draft: "neutral",
  todo: "neutral",
  in_progress: "progress",
  code_review: "code-review",
  business_review: "business-review",
  done: "done",
  cancelled: "cancelled",
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <Badge variant="quiet" className="gap-1.5">
      <StatusDot tone={TONE_BY_STATUS[status]} />
      {statusConfig[status].label}
    </Badge>
  );
}
