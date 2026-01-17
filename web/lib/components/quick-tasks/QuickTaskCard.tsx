"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { IconSubtask, IconGitPullRequest } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import Link from "next/link";

type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

const statusCardBg: Record<TaskStatus, string> = {
  todo: "bg-neutral-50 dark:bg-neutral-800",
  in_progress: "bg-yellow-50 dark:bg-yellow-900/20",
  code_review: "bg-purple-50 dark:bg-purple-900/20",
  done: "bg-green-50 dark:bg-green-900/20",
};

interface QuickTaskCardProps {
  id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  onClick?: () => void;
}

export function QuickTaskCard({
  id,
  title,
  description,
  status,
  onClick,
}: QuickTaskCardProps) {
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;

  return (
    <Card isPressable={!!onClick} onPress={onClick} shadow="none" className={`w-full ${statusCardBg[status]}`}>
      <CardBody className="p-3 gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
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
        </div>
        {description && (
          <p className="text-xs text-default-500 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-default-400">
          <IconSubtask size={12} />
          <SubtaskProgress taskId={id} />
        </div>
      </CardBody>
    </Card>
  );
}
