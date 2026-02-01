"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { useState, useMemo } from "react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ProjectTaskCard } from "./ProjectTaskCard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { statusConfig } from "@/lib/components/tasks/TaskStatusBadge";
import { Chip } from "@heroui/react";

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
  projectId: Id<"projects">;
}

export function ProjectTaskListPanel({ projectId }: ProjectTaskListPanelProps) {
  const tasks = useQuery(api.agentTasks.listByProject, { projectId });
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"agentTasks"> | null>(
    null,
  );

  const groupedTasks = useMemo(() => {
    if (!tasks) return null;
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

  if (!tasks || !groupedTasks) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
      </div>
    );
  }

  const nonEmptyStatuses = STATUS_ORDER.filter(
    (status) => groupedTasks[status].length > 0,
  );
  const defaultExpandedKeys = nonEmptyStatuses.filter((s) => s !== "done");

  return (
    <div className="h-full overflow-y-auto scrollbar">
      <Accordion
        selectionMode="multiple"
        className="px-0 [&_hr]:bg-neutral-100 dark:[&_hr]:bg-neutral-800"
        defaultExpandedKeys={defaultExpandedKeys}
      >
        {STATUS_ORDER.map((status) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const statusTasks = groupedTasks[status];
          return (
            <AccordionItem
              key={status}
              title={
                <Chip
                  startContent={
                    <StatusIcon size={14} className={`ml-1 ${config.text}`} />
                  }
                  variant="flat"
                  className={`${config.bg} ${config.text} shadow-inner`}
                  endContent={
                    <Chip size="sm" className={`${config.text} ${config.bg}`}>
                      {statusTasks.length}
                    </Chip>
                  }
                >
                  {config.label}
                </Chip>
              }
              classNames={{
                trigger: "p-2",
                content: "flex flex-col gap-2 px-3",
              }}
            >
              {statusTasks.length === 0 ? (
                <p className="text-sm text-default-400 py-2">No tasks</p>
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
                    onClick={() => setSelectedTaskId(task._id)}
                  />
                ))
              )}
            </AccordionItem>
          );
        })}
      </Accordion>
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          taskId={selectedTaskId}
        />
      )}
    </div>
  );
}
