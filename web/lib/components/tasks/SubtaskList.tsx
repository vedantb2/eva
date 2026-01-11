"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { IconPlus, IconTrash, IconCheck } from "@tabler/icons-react";

interface SubtaskListProps {
  taskId: Id<"agentTasks">;
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const subtasks = useQuery(api.subtasks.listByTask, { parentTaskId: taskId });
  const createSubtask = useMutation(api.subtasks.create);
  const updateSubtask = useMutation(api.subtasks.update);
  const removeSubtask = useMutation(api.subtasks.remove);

  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await createSubtask({ parentTaskId: taskId, title: newTitle.trim() });
    setNewTitle("");
    setIsAdding(false);
  };

  const handleToggle = async (id: Id<"subtasks">, completed: boolean) => {
    await updateSubtask({ id, completed: !completed });
  };

  const handleRemove = async (id: Id<"subtasks">) => {
    await removeSubtask({ id });
  };

  if (subtasks === undefined) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
        </h4>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700"
          >
            <IconPlus size={14} />
            Add
          </button>
        )}
      </div>

      {subtasks.length === 0 && !isAdding && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          No subtasks yet
        </p>
      )}

      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask._id}
            className="flex items-center gap-2 group p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <button
              onClick={() => handleToggle(subtask._id, subtask.completed)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                subtask.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-neutral-300 dark:border-neutral-600 hover:border-green-500"
              }`}
            >
              {subtask.completed && <IconCheck size={12} />}
            </button>
            <span
              className={`flex-1 text-sm ${
                subtask.completed
                  ? "text-neutral-400 line-through"
                  : "text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {subtask.title}
            </span>
            <button
              onClick={() => handleRemove(subtask._id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity"
            >
              <IconTrash size={14} />
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Subtask title..."
            className="flex-1 px-2 py-1.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-pink-500"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="px-3 py-1.5 text-sm bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewTitle("");
            }}
            className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
