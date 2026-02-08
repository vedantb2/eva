"use client";

import { Badge } from "@conductor/ui";
import {
  IconCircle,
  IconClock,
  IconClipboardCheck,
  IconEye,
  IconCircleCheck,
} from "@tabler/icons-react";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "business_review"
  | "code_review"
  | "done";

export const TASK_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "business_review",
  "code_review",
  "done",
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
  todo: {
    bg: "bg-secondary",
    cardBg: "bg-secondary",
    bar: "bg-muted-foreground",
    text: "text-muted-foreground",
    label: "To Do",
    icon: IconCircle,
  },
  in_progress: {
    bg: "bg-yellow-200 dark:bg-yellow-900/60",
    cardBg: "bg-yellow-50 dark:bg-yellow-900/20",
    bar: "bg-yellow-400 dark:bg-yellow-500",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "In Progress",
    icon: IconClock,
  },
  business_review: {
    bg: "bg-orange-200 dark:bg-orange-900/60",
    cardBg: "bg-orange-50 dark:bg-orange-900/20",
    bar: "bg-orange-400 dark:bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
    label: "Business Review",
    icon: IconClipboardCheck,
  },
  code_review: {
    bg: "bg-purple-200 dark:bg-purple-900/60",
    cardBg: "bg-purple-100/60 dark:bg-purple-900/20",
    bar: "bg-purple-400 dark:bg-purple-500",
    text: "text-purple-700 dark:text-purple-400",
    label: "Code Review",
    icon: IconEye,
  },
  done: {
    bg: "bg-green-200 dark:bg-green-900/60",
    cardBg: "bg-green-50 dark:bg-green-900/20",
    bar: "bg-green-400 dark:bg-green-500",
    text: "text-green-700 dark:text-green-400",
    label: "Done",
    icon: IconCircleCheck,
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
