"use client";

import { cn } from "@/lib/utils/cn";

type TaskStatus =
  | "archived"
  | "backlog"
  | "todo"
  | "in_progress"
  | "code_review"
  | "done";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  TaskStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  archived: {
    bg: "bg-neutral-100 dark:bg-neutral-700",
    text: "text-neutral-500 dark:text-neutral-400",
    dot: "bg-neutral-400",
    label: "Archived",
  },
  backlog: {
    bg: "bg-neutral-100 dark:bg-neutral-700",
    text: "text-neutral-600 dark:text-neutral-300",
    dot: "bg-neutral-500",
    label: "Backlog",
  },
  todo: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    label: "To Do",
  },
  in_progress: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    dot: "bg-yellow-500 animate-pulse",
    label: "In Progress",
  },
  code_review: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    dot: "bg-purple-500",
    label: "Code Review",
  },
  done: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
    label: "Done",
  },
};

export function TaskStatusBadge({
  status,
  size = "sm",
  className,
}: TaskStatusBadgeProps) {
  const config = statusConfig[status];

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
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
