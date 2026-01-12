"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { TaskStatusBadge } from "@/lib/components/tasks/TaskStatusBadge";
import { DependencyBadge } from "@/lib/components/tasks/DependencyBadge";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { IconGitBranch } from "@tabler/icons-react";

type TaskStatus =
  | "archived"
  | "backlog"
  | "todo"
  | "in_progress"
  | "code_review"
  | "done";

interface FeatureTaskCardProps {
  id: Id<"agentTasks">;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  branchName?: string;
  onClick?: () => void;
}

export function FeatureTaskCard({
  id,
  taskNumber,
  title,
  description,
  status,
  branchName,
  onClick,
}: FeatureTaskCardProps) {
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId: id });

  return (
    <Card isPressable={!!onClick} onPress={onClick} className="w-full">
      <CardBody className="p-3 gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-default-400 font-mono text-sm">
              #{taskNumber}
            </span>
            <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
          </div>
          <div className="flex items-center gap-1">
            <DependencyBadge isBlocked={isBlocked ?? false} />
            <TaskStatusBadge status={status} />
          </div>
        </div>
        {description && (
          <p className="text-xs text-default-500 line-clamp-2">{description}</p>
        )}
        {branchName && (
          <div className="flex items-center gap-1 text-xs text-default-400">
            <IconGitBranch size={12} />
            <span className="font-mono truncate">{branchName}</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
