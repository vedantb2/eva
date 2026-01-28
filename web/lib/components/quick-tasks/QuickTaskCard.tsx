"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { IconSubtask, IconGitPullRequest } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import Link from "next/link";
import { UserInitials } from "@/lib/components/ui/UserInitials";

export type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

export const statusCardBg: Record<TaskStatus, string> = {
  todo: "bg-neutral-200/40 dark:bg-neutral-800",
  in_progress: "bg-yellow-50 dark:bg-yellow-900/20",
  code_review: "bg-purple-100/60 dark:bg-purple-900/20",
  done: "bg-green-50 dark:bg-green-900/20",
};

interface QuickTaskCardProps {
  id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  createdBy?: Id<"users">;
  onClick?: () => void;
}

export function QuickTaskCard({
  id,
  title,
  description,
  status,
  createdBy,
  onClick,
}: QuickTaskCardProps) {
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const creator = useQuery(
    api.users.get,
    createdBy ? { id: createdBy } : "skip"
  );
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const hasError = runs?.[0]?.status === "error";

  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      shadow="none"
      radius="sm"
      className={`w-full shadow ${statusCardBg[status]} ${hasError ? "border-2 border-danger-500" : ""}`}
    >
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
        <div className="flex items-center justify-between mt-2">
          {creator && (
            <UserInitials
              firstName={creator.firstName}
              lastName={creator.lastName}
            />
          )}
          <div className="flex items-center gap-1 text-xs text-default-400">
            <IconSubtask size={12} />
            <SubtaskProgress taskId={id} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
