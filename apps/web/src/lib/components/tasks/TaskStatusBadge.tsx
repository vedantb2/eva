"use client";

import { Badge } from "@conductor/ui";
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
    cardBg: "bg-secondary",
    bar: "bg-muted-foreground/50",
    text: "text-muted-foreground",
    label: "Draft",
    icon: IconPencil,
  },
  todo: {
    bg: "bg-secondary",
    cardBg: "bg-secondary",
    bar: "bg-foreground/50",
    text: "text-muted-foreground",
    label: "To Do",
    icon: IconCircle,
  },
  in_progress: {
    bg: "bg-status-progress-bg",
    cardBg: "bg-status-progress-subtle",
    bar: "bg-status-progress-bar",
    text: "text-status-progress",
    label: "In Progress",
    icon: IconClock,
  },
  code_review: {
    bg: "bg-status-code-review-bg",
    cardBg: "bg-status-code-review-subtle",
    bar: "bg-status-code-review-bar",
    text: "text-status-code-review",
    label: "Code Review",
    icon: IconEye,
  },
  business_review: {
    bg: "bg-status-business-review-bg",
    cardBg: "bg-status-business-review-subtle",
    bar: "bg-status-business-review-bar",
    text: "text-status-business-review",
    label: "Business Review",
    icon: IconClipboardCheck,
  },
  done: {
    bg: "bg-status-done-bg",
    cardBg: "bg-status-done-subtle",
    bar: "bg-status-done-bar",
    text: "text-status-done",
    label: "Done",
    icon: IconCircleCheck,
  },
  cancelled: {
    bg: "bg-status-cancelled-bg",
    cardBg: "bg-status-cancelled-subtle",
    bar: "bg-status-cancelled-bar",
    text: "text-status-cancelled",
    label: "Cancelled",
    icon: IconCircleX,
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={`${config.text} ${config.bg} border-transparent`}>
      <Icon size={14} className={`mr-1 ${config.text}`} />
      {config.label}
    </Badge>
  );
}
