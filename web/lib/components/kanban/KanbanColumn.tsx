"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";
import { IconCircle, IconClock, IconEye, IconCircleCheck } from "@tabler/icons-react";

export interface ColumnConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  icon: typeof IconCircle;
}

type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

export const TASK_STATUS_CONFIG: Record<TaskStatus, ColumnConfig> = {
  todo: { label: "To Do", badgeBg: "bg-neutral-100 dark:bg-neutral-700", badgeText: "text-neutral-600 dark:text-neutral-300", icon: IconCircle },
  in_progress: { label: "In Progress", badgeBg: "bg-yellow-100 dark:bg-yellow-900/30", badgeText: "text-yellow-700 dark:text-yellow-400", icon: IconClock },
  code_review: { label: "Code Review", badgeBg: "bg-purple-100 dark:bg-purple-900/30", badgeText: "text-purple-700 dark:text-purple-400", icon: IconEye },
  done: { label: "Done", badgeBg: "bg-green-100 dark:bg-green-900/30", badgeText: "text-green-700 dark:text-green-400", icon: IconCircleCheck },
};

interface KanbanColumnProps {
  id: string;
  config: ColumnConfig;
  count: number;
  children: ReactNode;
  droppable?: boolean;
}

export function KanbanColumn({
  id,
  config,
  count,
  children,
  droppable = true,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable });

  return (
    <Card
      ref={setNodeRef}
      shadow="none"
      className={`flex-1 min-w-0 h-full transition-colors flex flex-col ${
        isOver
          ? "bg-neutral-200 dark:bg-neutral-700"
          : "bg-neutral-100 dark:bg-neutral-800/50"
      }`}
    >
      <CardHeader className="flex justify-between items-center pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <config.icon size={16} className={config.badgeText} />
          <span className="font-medium">{config.label}</span>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.badgeBg} ${config.badgeText}`}
          >
            {count}
          </span>
        </div>
      </CardHeader>
      <CardBody className="pt-0 overflow-y-auto space-y-2 flex-1 min-h-0">{children}</CardBody>
    </Card>
  );
}

export const KANBAN_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "code_review",
  "done",
];

export const ALL_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "code_review",
  "done",
];
