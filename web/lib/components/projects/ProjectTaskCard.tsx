"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { DependencyBadge } from "@/lib/components/tasks/DependencyBadge";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { IconSubtask, IconGitPullRequest } from "@tabler/icons-react";
import Link from "next/link";
import { statusConfig, type TaskStatus } from "@/lib/components/tasks/TaskStatusBadge";
import { UserInitials } from "@/lib/components/ui/UserInitials";

interface ProjectTaskCardProps {
  id: Id<"agentTasks">;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  createdBy?: Id<"users">;
  onClick?: () => void;
}

export function ProjectTaskCard({
  id,
  taskNumber,
  title,
  description,
  status,
  createdBy,
  onClick,
}: ProjectTaskCardProps) {
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId: id });
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;

  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      shadow="none"
      radius="sm"
      className={`w-full shadow ${statusConfig[status].cardBg}`}
    >
      <CardBody className="p-2 gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-default-400 font-mono text-sm flex-shrink-0">
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
                className="flex-shrink-0 p-1 rounded hover:bg-default-200 transition-colors"
              >
                <IconGitPullRequest size={14} className="text-success-500" />
              </Link>
            )}
            <DependencyBadge isBlocked={isBlocked ?? false} status={status} />
          </div>
        </div>
        {description && (
          <p className="text-xs text-default-500 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-default-400">
          {createdBy && <UserInitials userId={createdBy} />}
          <SubtaskProgress taskId={id} />
        </div>
      </CardBody>
    </Card>
  );
}
