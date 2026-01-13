"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { DependencyBadge } from "@/lib/components/tasks/DependencyBadge";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { IconGitBranch, IconSubtask } from "@tabler/icons-react";

type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

const statusCardBg: Record<TaskStatus, string> = {
  todo: "bg-neutral-50 dark:bg-neutral-800",
  in_progress: "bg-yellow-50 dark:bg-yellow-900/20",
  code_review: "bg-purple-50 dark:bg-purple-900/20",
  done: "bg-green-50 dark:bg-green-900/20",
};

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
    <Card isPressable={!!onClick} onPress={onClick} className={`w-full ${statusCardBg[status]}`}>
      <CardBody className="p-3 gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-default-400 font-mono text-sm flex-shrink-0">
              #{taskNumber}
            </span>
            <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
          </div>
          <DependencyBadge isBlocked={isBlocked ?? false} status={status} />
        </div>
        {description && (
          <p className="text-xs text-default-500 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-default-400">
          {branchName && (
            <div className="flex items-center gap-1">
              <IconGitBranch size={12} />
              <span className="font-mono truncate">{branchName}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <IconSubtask size={12} />
            <SubtaskProgress taskId={id} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
