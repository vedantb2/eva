"use client";

import { Badge, Card, CardHeader, CardContent } from "@conductor/ui";
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
  emptyLabel?: string;
}

export function KanbanColumn({
  id,
  config,
  count,
  children,
  droppable = true,
  headerExtra,
  emptyLabel = "No items",
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable });
  const Icon = config.icon;

  return (
    <Card
      ref={setNodeRef}
      className={`flex min-h-0 min-w-0 flex-1 self-stretch flex-col overflow-clip shadow-none transition-colors duration-200 border-none ${
        isOver ? "bg-primary/10" : "bg-accent/40"
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-2 pb-1 md:p-2 md:pb-1 flex-shrink-0 space-y-0">
        <Badge
          variant="outline"
          className={`${config.bg} ${config.text} gap-1.5 border-transparent`}
        >
          <Icon size={14} className={config.text} />
          {config.label}
          <span className="text-foreground/50 tabular-nums">{count}</span>
        </Badge>
        {headerExtra}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain p-1.5 pt-0 scrollbar md:p-1.5 md:pt-0">
        {count === 0 && (
          <div className="flex flex-1 items-center justify-center py-6 text-xs text-muted-foreground/50">
            {emptyLabel}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
