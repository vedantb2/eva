"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { AgentTaskCard } from "./AgentTaskCard";
import { IconPlus, IconPlayerPlay } from "@tabler/icons-react";

type AgentStatus = "idle" | "queued" | "running" | "reviewing" | "completed" | "failed";

interface AgentTask {
  _id: Id<"agentTasks">;
  boardId: Id<"boards">;
  columnId: Id<"columns">;
  title: string;
  description?: string;
  status: AgentStatus;
  order: number;
}

interface Column {
  _id: Id<"columns">;
  boardId: Id<"boards">;
  name: string;
  order: number;
  isRunColumn?: boolean;
  tasks: AgentTask[];
}

interface AgentColumnProps {
  column: Column;
}

export function AgentColumn({ column }: AgentColumnProps) {
  const createTask = useMutation(api.agentTasks.create);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { setNodeRef, isOver } = useDroppable({
    id: column._id,
  });

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createTask({
      columnId: column._id,
      title: newTitle.trim(),
    });
    setNewTitle("");
    setIsCreating(false);
  };

  const taskIds = column.tasks.map((t) => t._id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-3 transition-colors ${
        isOver ? "bg-neutral-200 dark:bg-neutral-700/50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 text-sm uppercase tracking-wide">
            {column.name}
          </h3>
          {column.isRunColumn && (
            <IconPlayerPlay size={14} className="text-blue-500" />
          )}
        </div>
        <span className="text-xs font-medium text-neutral-500 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
          {column.tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 flex flex-col gap-2 min-h-[100px]">
          {column.tasks.map((task) => (
            <AgentTaskCard key={task._id} task={task} />
          ))}
        </div>
      </SortableContext>

      {isCreating ? (
        <div className="mt-2 p-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewTitle("");
              }
            }}
            className="w-full px-2 py-1 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
            placeholder="Task title"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 px-2 py-1 text-xs font-medium text-white bg-pink-600 hover:bg-pink-700 rounded"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTitle("");
              }}
              className="px-2 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              Cancel
            </button>
          </div>
        </div>
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
