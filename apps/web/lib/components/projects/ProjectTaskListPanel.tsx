"use client";

import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import { useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@conductor/ui";
import { QuickTaskCard } from "@/lib/components/quick-tasks/QuickTaskCard";
import {
  statusConfig,
  TASK_STATUSES,
} from "@/lib/components/tasks/TaskStatusBadge";

type Task = FunctionReturnType<typeof api.agentTasks.listByProject>[number];
type TaskStatus = Task["status"];

interface ProjectTaskListPanelProps {
  tasks: Task[];
  selectedTaskId: Id<"agentTasks"> | null;
  onSelectTask: (id: Id<"agentTasks">) => void;
}

export function ProjectTaskListPanel({
  tasks,
  selectedTaskId,
  onSelectTask,
}: ProjectTaskListPanelProps) {
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      draft: [],
      todo: [],
      in_progress: [],
      code_review: [],
      business_review: [],
      done: [],
      cancelled: [],
    };
    for (const task of tasks) {
      groups[task.status].push(task);
    }
    return groups;
  }, [tasks]);

  const nonEmptyStatuses = TASK_STATUSES.filter(
    (status) => groupedTasks[status].length > 0,
  );
  const defaultExpandedKeys = nonEmptyStatuses.filter(
    (s) => s !== "done" && s !== "cancelled",
  );

  return (
    <div className="h-full overflow-y-auto scrollbar">
      <Accordion
        type="multiple"
        className="px-0 [&_hr]:bg-border"
        defaultValue={defaultExpandedKeys}
      >
        {TASK_STATUSES.map((status) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const statusTasks = groupedTasks[status];
          return (
            <AccordionItem key={status} value={status}>
              <AccordionTrigger className="p-2 hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <StatusIcon size={14} className={config.text} />
                  <span className={`text-sm font-medium ${config.text}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground/60 tabular-nums">
                    {statusTasks.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 px-3">
                {statusTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No tasks</p>
                ) : (
                  statusTasks.map((task) => (
                    <QuickTaskCard
                      key={task._id}
                      id={task._id}
                      title={task.title}
                      description={task.description}
                      status={task.status}
                      taskNumber={task.taskNumber ?? 0}
                      tags={task.tags}
                      createdBy={task.createdBy}
                      createdAt={task._creationTime}
                      scheduledAt={task.scheduledAt}
                      isActive={selectedTaskId === task._id}
                      onClick={() => onSelectTask(task._id)}
                    />
                  ))
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
