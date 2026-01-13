"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { IconSubtask } from "@tabler/icons-react";

type TaskStatus =
  | "archived"
  | "backlog"
  | "todo"
  | "in_progress"
  | "code_review"
  | "done";

const statusCardBg: Record<TaskStatus, string> = {
  archived: "bg-red-50 dark:bg-red-900/20",
  backlog: "bg-neutral-50 dark:bg-neutral-800",
  todo: "bg-blue-50 dark:bg-blue-900/20",
  in_progress: "bg-yellow-50 dark:bg-yellow-900/20",
  code_review: "bg-pink-50 dark:bg-pink-900/20",
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
  return (
    <Card isPressable={!!onClick} onPress={onClick} className={`w-full ${statusCardBg[status]}`}>
      <CardBody className="p-3 gap-2">
        <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
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
