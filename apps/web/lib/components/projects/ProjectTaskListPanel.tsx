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
  Badge,
} from "@conductor/ui";
import { ProjectTaskCard } from "./ProjectTaskCard";
import { statusConfig } from "@/lib/components/tasks/TaskStatusBadge";

type Task = FunctionReturnType<typeof api.agentTasks.listByProject>[number];
type TaskStatus = Task["status"];

const STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "business_review",
  "code_review",
  "done",
];

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
      todo: [],
      in_progress: [],
      business_review: [],
      code_review: [],
      done: [],
    };
    for (const task of tasks) {
      groups[task.status].push(task);
    }
    return groups;
  }, [tasks]);

  const nonEmptyStatuses = STATUS_ORDER.filter(
    (status) => groupedTasks[status].length > 0,
  );
  const defaultExpandedKeys = nonEmptyStatuses.filter((s) => s !== "done");

  return (
    <div className="h-full overflow-y-auto scrollbar">
      <Accordion
        type="multiple"
        className="px-0 [&_hr]:bg-border"
        defaultValue={defaultExpandedKeys}
      >
        {STATUS_ORDER.map((status) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const statusTasks = groupedTasks[status];
          return (
            <AccordionItem key={status} value={status}>
              <AccordionTrigger className="p-2 hover:no-underline">
                <Badge
                  variant="outline"
                  className={`${config.bg} ${config.text} shadow-inner gap-1.5`}
                >
                  <StatusIcon size={14} className={config.text} />
                  {config.label}
                  <Badge
                    variant="outline"
                    className={`${config.text} ${config.bg} ml-1 px-1.5 py-0`}
                  >
                    {statusTasks.length}
                  </Badge>
                </Badge>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 px-3">
                {statusTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No tasks</p>
                ) : (
                  statusTasks.map((task) => (
                    <ProjectTaskCard
                      key={task._id}
                      id={task._id}
                      taskNumber={task.taskNumber ?? 0}
                      title={task.title}
                      description={task.description}
                      status={task.status}
                      createdBy={task.createdBy}
                      isSelected={selectedTaskId === task._id}
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
