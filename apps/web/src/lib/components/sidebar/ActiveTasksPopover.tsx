"use client";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Badge,
} from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { TaskStatusBadge } from "@/lib/components/tasks/TaskStatusBadge";
import { IconCube, IconListCheck } from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import { DynamicLink } from "@/lib/components/DynamicLink";

interface ActiveTasksBadgeProps {
  repoId: Id<"githubRepos">;
  basePath: string;
}

export function ActiveTasksBadge({ repoId, basePath }: ActiveTasksBadgeProps) {
  const allTasks = useQuery(api.agentTasks.getActiveTasks, { repoId });
  const quickTasks = allTasks?.filter((t) => !t.projectId) ?? [];
  const tasks = quickTasks.filter((t) => t.status === "in_progress");
  const sandboxCount = quickTasks.filter(
    (t) =>
      t.reviewTaskSandboxStatus === "active" ||
      t.reviewTaskSandboxStatus === "starting",
  ).length;

  if (tasks.length === 0 && sandboxCount === 0) {
    return null;
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Badge
          variant="secondary"
          className="ml-auto cursor-default items-center gap-1.5 border-none bg-sidebar-accent/50 px-1.5 py-0.5"
        >
          {tasks.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{
                    backgroundColor: "rgb(var(--status-progress-bar))",
                  }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: "rgb(var(--status-progress-bar))",
                  }}
                />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {tasks.length}
              </span>
            </span>
          )}
          {sandboxCount > 0 && (
            <span className="flex items-center gap-0.5">
              <IconCube size={11} className="text-muted-foreground" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {sandboxCount}
              </span>
            </span>
          )}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-[min(20rem,calc(100vw-2rem))]"
      >
        <div className="space-y-1">
          <div className="mb-3 flex items-center gap-2">
            <IconListCheck size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Active Tasks
            </h3>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="rounded-full bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground">
                {tasks.length} running
              </span>
              {sandboxCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground">
                  <IconCube size={11} />
                  {sandboxCount}
                </span>
              )}
            </span>
          </div>
          <div className="space-y-1">
            {tasks.map((task) => (
              <DynamicLink
                key={task._id}
                to={`${basePath}/quick-tasks/${task._id}`}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <div className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-muted/60">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {task.title}
                    </p>
                    {task.taskNumber && (
                      <p className="text-xs text-muted-foreground">
                        Task #{task.taskNumber}
                      </p>
                    )}
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>
              </DynamicLink>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
