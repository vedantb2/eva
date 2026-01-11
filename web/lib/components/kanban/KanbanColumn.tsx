"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Id } from "../../../../backend/convex/_generated/dataModel";
import { TaskCard } from "./TaskCard";
import { CreateTaskForm } from "./CreateTaskForm";
import { IconPlus } from "@tabler/icons-react";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  _id: Id<"tasks">;
  projectId: Id<"projects">;
  title: string;
  description?: string;
  status: TaskStatus;
  order: number;
  createdAt: number;
  updatedAt: number;
}

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  projectId: Id<"projects">;
}

const columnColors: Record<TaskStatus, string> = {
  todo: "border-t-neutral-400",
  in_progress: "border-t-blue-500",
  done: "border-t-green-500",
};

export function KanbanColumn({ id, title, tasks, projectId }: KanbanColumnProps) {
  const [isCreating, setIsCreating] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const taskIds = tasks.map((t) => t._id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-neutral-100 dark:bg-neutral-800/50 rounded-xl border-t-4 ${columnColors[id]} p-3 transition-colors ${
        isOver ? "bg-neutral-200 dark:bg-neutral-700/50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-xs font-medium text-neutral-500 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 flex flex-col gap-2 min-h-[100px]">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      </SortableContext>

      {isCreating ? (
        <CreateTaskForm
          projectId={projectId}
          status={id}
          onClose={() => setIsCreating(false)}
        />
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="mt-2 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 py-2"
        >
          <IconPlus size={14} />
          <span>Add task</span>
        </button>
      )}
    </div>
  );
}
