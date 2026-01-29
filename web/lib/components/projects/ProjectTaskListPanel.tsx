"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useState, useMemo } from "react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ProjectTaskCard } from "./ProjectTaskCard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import {
  IconCircle,
  IconProgress,
  IconClipboardCheck,
  IconEye,
  IconCircleCheck,
} from "@tabler/icons-react";

type TaskStatus = "todo" | "in_progress" | "business_review" | "code_review" | "done";

interface Task {
  _id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  taskNumber?: number;
  order: number;
  createdBy?: Id<"users">;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  todo: {
    label: "To Do",
    icon: <IconCircle size={16} />,
    color: "text-default-500",
  },
  in_progress: {
    label: "In Progress",
    icon: <IconProgress size={16} />,
    color: "text-yellow-500",
  },
  business_review: {
    label: "Business Review",
    icon: <IconClipboardCheck size={16} />,
    color: "text-orange-500",
  },
  code_review: {
    label: "Code Review",
    icon: <IconEye size={16} />,
    color: "text-purple-500",
  },
  done: {
    label: "Done",
    icon: <IconCircleCheck size={16} />,
    color: "text-green-500",
  },
};

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
          const config = STATUS_CONFIG[status];
          const statusTasks = groupedTasks[status];
          return (
            <AccordionItem
              key={status}
              title={
                <div className={`flex items-center gap-2 ${config.color}`}>
                  {config.icon}
                  <span className="font-medium">{config.label}</span>
                  <span className="text-default-400 text-sm">
                    ({statusTasks.length})
                  </span>
                </div>
              }
              classNames={{
                trigger: "px-3",
                content: "flex flex-col gap-2 px-4",
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
                    onClick={() => setSelectedTask(task)}
                  />
                ))
              )}
            </AccordionItem>
          );
        })}
      </Accordion>
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask._id}
          taskNumber={selectedTask.taskNumber}
          title={selectedTask.title}
          description={selectedTask.description}
          status={selectedTask.status}
          createdBy={selectedTask.createdBy}
        />
      )}
    </div>
  );
}
