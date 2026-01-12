"use client";

import { Card, CardBody } from "@heroui/card";
import { GenericId as Id } from "convex/values";
import { TaskStatusBadge } from "@/lib/components/tasks/TaskStatusBadge";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { IconSubtask } from "@tabler/icons-react";

type TaskStatus =
  | "archived"
  | "backlog"
  | "todo"
  | "in_progress"
  | "code_review"
  | "done";

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
    <Card isPressable={!!onClick} onPress={onClick} className="w-full">
      <CardBody className="p-3 gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
          <TaskStatusBadge status={status} />
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
