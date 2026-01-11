"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import { api } from "../../../../backend/convex/_generated/api";
import { Id } from "../../../../backend/convex/_generated/dataModel";
import { IconTrash, IconEdit, IconCheck, IconX, IconGripVertical } from "@tabler/icons-react";

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

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging: isDraggingOverlay }: TaskCardProps) {
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = async () => {
    await updateTask({
      id: task._id,
      title: title.trim(),
      description: description.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await removeTask({ id: task._id });
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
          placeholder="Task title"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
          placeholder="Description (optional)"
          rows={2}
        />
        <div className="flex justify-end gap-1">
          <button
            onClick={handleCancel}
            className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <IconX size={14} />
          </button>
          <button
            onClick={handleSave}
            className="p-1.5 text-green-600 hover:text-green-700"
          >
            <IconCheck size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow ${
        isDraggingOverlay ? "shadow-lg ring-2 ring-pink-500" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 text-neutral-300 hover:text-neutral-500 cursor-grab active:cursor-grabbing touch-none"
        >
          <IconGripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {task.title}
            </h4>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <IconEdit size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-neutral-400 hover:text-red-500"
              >
                <IconTrash size={14} />
              </button>
            </div>
          </div>
          {task.description && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
