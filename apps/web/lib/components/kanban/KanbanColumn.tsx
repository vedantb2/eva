"use client";

import { Badge, Card, CardContent, CardHeader } from "@conductor/ui";
import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";
import type { IconCircle } from "@tabler/icons-react";
import { TASK_STATUSES } from "@/lib/components/tasks/TaskStatusBadge";

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
      className={`flex min-h-0 min-w-0 flex-1 self-stretch flex-col overflow-hidden transition-colors ${
        isOver ? "bg-muted dark:bg-accent" : "bg-card"
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-1.5 pb-1 md:p-1.5 md:pb-1 flex-shrink-0 space-y-0">
        <Badge
          variant="outline"
          className={`${config.bg} ${config.text} shadow-inner gap-1.5`}
        >
          <Icon size={14} className={config.text} />
          {config.label}
          <Badge
            variant="outline"
            className={`${config.text} ${config.bg} ml-1 px-1.5 py-0`}
          >
            {count}
          </Badge>
        </Badge>
        {headerExtra}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain p-1 pt-0 scrollbar md:p-1 md:pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
