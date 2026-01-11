"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { IconCheck, IconX } from "@tabler/icons-react";

type TaskStatus = "todo" | "in_progress" | "done";

interface CreateTaskFormProps {
  projectId: Id<"projects">;
  status: TaskStatus;
  onClose: () => void;
}

export function CreateTaskForm({ projectId, status, onClose }: CreateTaskFormProps) {
  const createTask = useMutation(api.tasks.create);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    await createTask({
      projectId,
      title: title.trim(),
      status,
    });
    setIsLoading(false);
    setTitle("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="mt-2 p-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1.5 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
        placeholder="Enter task title..."
        autoFocus
        disabled={isLoading}
      />
      <div className="flex justify-end gap-1">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-50"
        >
          <IconX size={14} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !title.trim()}
          className="p-1.5 text-green-600 hover:text-green-700 disabled:opacity-50"
        >
          <IconCheck size={14} />
        </button>
      </div>
    </div>
  );
}
