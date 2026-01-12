"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { ReactNode } from "react";

type TaskStatus =
  | "archived"
  | "backlog"
  | "todo"
  | "in_progress"
  | "code_review"
  | "done";

const statusConfig: Record<
  TaskStatus,
  { label: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "danger" }
> = {
  archived: { label: "Archived", color: "default" },
  backlog: { label: "Backlog", color: "default" },
  todo: { label: "To Do", color: "primary" },
  in_progress: { label: "In Progress", color: "warning" },
  code_review: { label: "Code Review", color: "secondary" },
  done: { label: "Done", color: "success" },
};

interface KanbanColumnProps {
  status: TaskStatus;
  count: number;
  children: ReactNode;
  onDrop?: (taskId: string) => void;
}

export function KanbanColumn({
  status,
  count,
  children,
}: KanbanColumnProps) {
  const config = statusConfig[status];

  return (
    <Card className="min-w-[280px] max-w-[320px] h-full flex-shrink-0">
      <CardHeader className="flex justify-between items-center pb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{config.label}</span>
          <Chip size="sm" variant="flat" color={config.color}>
            {count}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-0 overflow-y-auto space-y-2">
        {children}
      </CardBody>
    </Card>
  );
}

export const KANBAN_STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "code_review",
  "done",
];

export const ALL_STATUSES: TaskStatus[] = [
  "archived",
  "backlog",
  "todo",
  "in_progress",
  "code_review",
  "done",
];
