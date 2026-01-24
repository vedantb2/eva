"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { DependencyBadge } from "@/lib/components/tasks/DependencyBadge";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { IconGitBranch, IconSubtask, IconGitPullRequest } from "@tabler/icons-react";
import Link from "next/link";

type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

const statusCardBg: Record<TaskStatus, string> = {
  todo: "bg-neutral-50 dark:bg-neutral-800",
  in_progress: "bg-yellow-50 dark:bg-yellow-900/20",
  code_review: "bg-purple-50 dark:bg-purple-900/20",
  done: "bg-green-50 dark:bg-green-900/20",
};

interface ProjectTaskCardProps {
  id: Id<"agentTasks">;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  branchName?: string;
  onClick?: () => void;
}

export function ProjectTaskCard({
  id,
  taskNumber,
  title,
  description,
  status,
  branchName,
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
      className={`w-full ${statusCardBg[status]}`}
    >
      <CardBody className="p-3 gap-2">
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
