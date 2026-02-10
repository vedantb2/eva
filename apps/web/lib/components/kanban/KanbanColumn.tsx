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
      className={`flex-1 min-w-0 h-full transition-colors flex flex-col rounded-md ${
        isOver ? "bg-muted dark:bg-accent" : "bg-card"
      }`}
    >
      <CardHeader className="flex flex-row justify-between items-center p-2 pb-1 flex-shrink-0 space-y-0">
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
      <CardContent className="pt-0 p-2 overflow-y-auto scrollbar space-y-2 flex-1 min-h-0">
        {children}
      </CardContent>
    </Card>
  );
}
