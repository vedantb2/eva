"use client";

import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import {
  TASK_STATUSES,
  statusConfig,
} from "@/lib/components/tasks/TaskStatusBadge";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface QuickTasksStatusSummaryProps {
  tasks: Task[];
}

export function QuickTasksStatusSummary({
  tasks,
}: QuickTasksStatusSummaryProps) {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-6">
      <p className="text-sm text-muted-foreground mb-2">
        {tasks.length} {tasks.length === 1 ? "task" : "tasks"} total
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {TASK_STATUSES.map((status) => {
          const config = statusConfig[status];
          const count = counts.get(status) ?? 0;
          if (count === 0) return null;
          const Icon = config.icon;
          return (
            <div
              key={status}
              className="flex items-center gap-3 px-3 py-2 rounded-md"
            >
              <Icon size={16} className={config.text} />
              <span className={`text-sm font-medium ${config.text}`}>
                {config.label}
              </span>
              <span className={`ml-auto text-sm font-semibold ${config.text}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Select a task to view details
      </p>
    </div>
  );
}
