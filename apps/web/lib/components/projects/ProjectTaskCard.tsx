"use client";

import { Card, CardContent } from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { DependencyBadge } from "@/lib/components/tasks/DependencyBadge";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { IconSubtask, IconGitPullRequest } from "@tabler/icons-react";
import Link from "next/link";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { UserInitials } from "@/lib/components/ui/UserInitials";

interface ProjectTaskCardProps {
  id: Id<"agentTasks">;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  createdBy?: Id<"users">;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ProjectTaskCard({
  id,
  taskNumber,
  title,
  description,
  status,
  createdBy,
  isSelected,
  onClick,
}: ProjectTaskCardProps) {
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId: id });
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;

  return (
    <Card
      className={`w-full shadow shadow-none rounded-sm ${isSelected ? "ring-2 ring-primary" : ""} ${statusConfig[status].cardBg} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-2 gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground font-mono text-sm flex-shrink-0">
              #{taskNumber}
            </span>
            <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {latestPrUrl && (
              <Link
                href={latestPrUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
              >
                <IconGitPullRequest size={14} className="text-emerald-500" />
              </Link>
            )}
            <DependencyBadge isBlocked={isBlocked ?? false} status={status} />
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {createdBy && <UserInitials userId={createdBy} />}
          <SubtaskProgress taskId={id} />
        </div>
      </CardContent>
    </Card>
  );
}
