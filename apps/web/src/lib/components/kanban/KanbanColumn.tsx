"use client";

import { Badge } from "@conductor/ui";
import { KanbanBoard } from "@conductor/ui";
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
  const Icon = config.icon;

  return (
    <KanbanBoard
      id={id}
      disabled={!droppable}
      className="flex min-h-0 min-w-0 flex-1 self-stretch flex-col overflow-clip"
    >
      <div className="flex flex-row items-center justify-between p-2 flex-shrink-0">
        <Badge
          variant="outline"
          className={`${config.bg} ${config.text} gap-1.5 border-transparent py-1`}
        >
          <Icon size={14} className={config.text} />
          {config.label}
          <span className="text-foreground/50 tabular-nums">{count}</span>
        </Badge>
        {headerExtra}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-1.5 pt-0 scrollbar md:p-1.5 md:pt-0">
        {count === 0 && (
          <div className="flex flex-1 items-center justify-center py-6 text-xs text-muted-foreground/50">
            {emptyLabel}
          </div>
        )}
        {children}
      </div>
    </KanbanBoard>
  );
}
