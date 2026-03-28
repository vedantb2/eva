"use client";

import { useQuery } from "convex-helpers/react/cache";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Tooltip, TooltipTrigger, TooltipContent } from "@conductor/ui";
import {
  statusConfig,
  TASK_STATUSES,
} from "@/lib/components/tasks/TaskStatusBadge";

interface ProjectProgressBarProps {
  projectId: Id<"projects">;
  className?: string;
}

export function ProjectProgressBar({
  projectId,
  className,
}: ProjectProgressBarProps) {
  const progress = useQuery(api.projects.getTaskProgress, { projectId });

  if (!progress) return null;

  if (progress.total === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`h-1.5 overflow-hidden rounded-full bg-secondary/85 ${className ?? ""}`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <span className="text-xs text-muted-foreground">No tasks yet</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex h-1.5 overflow-hidden rounded-full bg-secondary ${className ?? ""}`}
        >
          {TASK_STATUSES.map((status) => {
            const count = progress[status];
            if (count === 0) return null;
            return (
              <div
                key={status}
                className={statusConfig[status].bar}
                style={{ width: `${(count / progress.total) * 100}%` }}
              />
            );
          })}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-1">
          {TASK_STATUSES.filter((s) => progress[s] > 0).map((s) => {
            const Icon = statusConfig[s].icon;
            return (
              <span
                key={s}
                className={`flex items-center gap-1.5 ${statusConfig[s].text}`}
              >
                <Icon size={12} /> {progress[s]} {statusConfig[s].label}
              </span>
            );
          })}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
