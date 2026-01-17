"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";
import { IconCircle, IconClock, IconEye, IconCircleCheck } from "@tabler/icons-react";

type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

const statusConfig: Record<
  TaskStatus,
  { label: string; badgeBg: string; badgeText: string; icon: typeof IconCircle }
> = {
  todo: { label: "To Do", badgeBg: "bg-neutral-100 dark:bg-neutral-700", badgeText: "text-neutral-600 dark:text-neutral-300", icon: IconCircle },
  in_progress: { label: "In Progress", badgeBg: "bg-yellow-100 dark:bg-yellow-900/30", badgeText: "text-yellow-700 dark:text-yellow-400", icon: IconClock },
  code_review: { label: "Code Review", badgeBg: "bg-purple-100 dark:bg-purple-900/30", badgeText: "text-purple-700 dark:text-purple-400", icon: IconEye },
  done: { label: "Done", badgeBg: "bg-green-100 dark:bg-green-900/30", badgeText: "text-green-700 dark:text-green-400", icon: IconCircleCheck },
};

interface KanbanColumnProps {
  status: TaskStatus;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({
  status,
  count,
  children,
}: KanbanColumnProps) {
  const config = statusConfig[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Card
      ref={setNodeRef}
      shadow="none"
      className={`min-w-[240px] sm:min-w-[280px] max-w-[280px] sm:max-w-[320px] h-full flex-shrink-0 transition-colors ${
        isOver ? "bg-pink-50 dark:bg-pink-900/20" : ""
      }`}
    >
      <CardHeader className="flex justify-between items-center pb-2">
        <div className="flex items-center gap-2">
          <config.icon size={16} className={config.badgeText} />
          <span className="font-medium">{config.label}</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.badgeBg} ${config.badgeText}`}>
            {count}
          </span>
        </div>
      </CardHeader>
      <CardBody className="pt-0 overflow-y-auto space-y-2">
        {children}
      </CardBody>
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
