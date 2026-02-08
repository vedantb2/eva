"use client";

import { cn } from "@conductor/ui";
import { IconLock, IconLockOpen } from "@tabler/icons-react";
import type { TaskStatus } from "@/lib/components/tasks/TaskStatusBadge";

interface DependencyBadgeProps {
  isBlocked: boolean;
  blockedByCount?: number;
  size?: "sm" | "md";
  className?: string;
  status?: TaskStatus;
}

export function DependencyBadge({
  isBlocked,
  blockedByCount,
  size = "sm",
  className,
  status,
}: DependencyBadgeProps) {
  if (status && status !== "todo") {
    return null;
  }

  if (!isBlocked) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          "bg-status-done-bg",
          "text-status-done",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
          className,
        )}
      >
        <IconLockOpen
          className={size === "sm" ? "w-3 h-3" : "w-4 h-4"}
          stroke={2}
        />
        Ready
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        "bg-red-100 dark:bg-red-900/30",
        "text-red-700 dark:text-red-400",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <IconLock className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} stroke={2} />
      Blocked
      {blockedByCount !== undefined &&
        blockedByCount > 0 &&
        ` (${blockedByCount})`}
    </span>
  );
}
