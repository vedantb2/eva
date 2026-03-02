"use client";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Button,
} from "@conductor/ui";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { TaskStatusBadge } from "@/lib/components/tasks/TaskStatusBadge";
import { IconListCheck } from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import Link from "next/link";

interface ActiveTasksPopoverProps {
  repoId?: Id<"githubRepos">;
  basePath: string;
}

export function ActiveTasksPopover({
  repoId,
  basePath,
}: ActiveTasksPopoverProps) {
  const allTasks = useQuery(api.agentTasks.getActiveTasks, { repoId });
  const tasks = allTasks?.filter((t) => t.status === "in_progress") ?? [];

  const getTaskLink = (task: NonNullable<typeof allTasks>[number]) => {
    if (task.projectId) {
      return `${basePath}/projects/${task.projectId}`;
    }
    return `${basePath}/quick-tasks`;
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-sidebar-border/70 bg-sidebar-accent/45 p-1.5">
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 rounded-lg px-3 py-2 hover:bg-sidebar-accent/70"
          >
            <IconListCheck size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              Active Tasks
            </span>
            <span className="ml-auto rounded-full border border-sidebar-border/70 bg-sidebar/70 px-1.5 py-0.5 text-xs text-muted-foreground">
              {tasks.length}
            </span>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80">
          <div className="space-y-1">
            <div className="mb-3 flex items-center gap-2">
              <IconListCheck size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Active Tasks
              </h3>
              <span className="ml-auto rounded-full border border-border/70 bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground">
                {tasks.length}
              </span>
            </div>
            <div className="space-y-1">
              {tasks.map((task) => (
                <Link
                  key={task._id}
                  href={getTaskLink(task)}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <div className="flex items-center justify-between rounded-lg border border-transparent p-2.5 transition-colors hover:border-border/70 hover:bg-accent/60">
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
                </Link>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
