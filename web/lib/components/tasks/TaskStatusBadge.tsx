"use client";

import { cn } from "@/lib/utils/cn";
import { IconCircle, IconClock, IconEye, IconCircleCheck } from "@tabler/icons-react";

type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  TaskStatus,
  { bg: string; text: string; label: string; icon: typeof IconCircle }
> = {
  todo: {
    bg: "bg-neutral-100 dark:bg-neutral-700",
    text: "text-neutral-600 dark:text-neutral-300",
    label: "To Do",
    icon: IconCircle,
  },
  in_progress: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "In Progress",
    icon: IconClock,
  },
  code_review: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    label: "Code Review",
    icon: IconEye,
  },
  done: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Done",
    icon: IconCircleCheck,
  },
};

export function TaskStatusBadge({
  status,
  size = "sm",
  className,
}: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

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
      <Icon size={size === "sm" ? 12 : 14} />
      {config.label}
    </span>
  );
}
