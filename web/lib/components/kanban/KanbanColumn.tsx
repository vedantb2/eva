"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";
import type { IconCircle } from "@tabler/icons-react";
import { TASK_STATUSES } from "@/lib/components/tasks/TaskStatusBadge";
import { Chip } from "@heroui/react";

export { TASK_STATUSES as KANBAN_STATUSES };

export interface ColumnConfig {
  bg: string;
  text: string;
  label: string;
  icon: typeof IconCircle;
}

interface KanbanColumnProps {
  id: string;
  config: ColumnConfig;
  count: number;
  children: ReactNode;
  droppable?: boolean;
  headerExtra?: ReactNode;
}

export function KanbanColumn({
  id,
  config,
  count,
  children,
  droppable = true,
  headerExtra,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable });
  const Icon = config.icon;

  return (
    <Card
      ref={setNodeRef}
      shadow="none"
      className={`flex-1 min-w-0 h-full transition-colors flex flex-col ${
        isOver
          ? "bg-neutral-200/70 dark:bg-neutral-700"
          : "bg-neutral-50 dark:bg-neutral-800/50"
      }`}
    >
      <CardHeader className="flex justify-between items-center p-2 pb-1 flex-shrink-0">
        <Chip
          startContent={<Icon size={14} className={`ml-1 ${config.text}`} />}
          variant="flat"
          className={`${config.bg}`}
          endContent={
            <Chip size="sm" className={`${config.text} ${config.bg}`}>
              {count}
            </Chip>
          }
        >
          {config.label}
        </Chip>
        {headerExtra}
      </CardHeader>
      <CardBody className="pt-0 p-2 overflow-y-auto scrollbar space-y-2 flex-1 min-h-0">
        {children}
      </CardBody>
    </Card>
  );
}
