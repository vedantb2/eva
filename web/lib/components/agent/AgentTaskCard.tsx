"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { IconTrash, IconEdit, IconCheck, IconX, IconGripVertical, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { AgentRunPanel } from "./AgentRunPanel";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";

type AgentStatus = "idle" | "queued" | "running" | "reviewing" | "completed" | "failed";

interface AgentTask {
  _id: Id<"agentTasks">;
  boardId: Id<"boards">;
  columnId: Id<"columns">;
  title: string;
  description?: string;
  branchName?: string;
  status: AgentStatus;
  order: number;
}

interface AgentTaskCardProps {
  task: AgentTask;
  isDragging?: boolean;
}

export function AgentTaskCard({ task, isDragging: isDraggingOverlay }: AgentTaskCardProps) {
  const updateTask = useMutation(api.agentTasks.update);
  const removeTask = useMutation(api.agentTasks.remove);

  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  const isLocked = task.status === "queued" || task.status === "running";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    disabled: isLocked,
  });

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

  const hasRuns = task.status !== "idle";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow ${
        isDraggingOverlay ? "shadow-lg ring-2 ring-pink-500" : ""
      } ${isLocked ? "opacity-80" : ""}`}
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            disabled={isLocked}
            className={`mt-0.5 p-0.5 text-neutral-300 hover:text-neutral-500 touch-none ${
              isLocked ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"
            }`}
          >
            <IconGripVertical size={14} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <button
                onClick={() => setIsDetailOpen(true)}
                className="text-left text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                {task.title}
              </button>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isLocked && (
                  <>
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
                  </>
                )}
              </div>
            </div>
            <AgentStatusBadge status={task.status} />
            {task.description && (
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        {hasRuns && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 w-full justify-center py-1"
          >
            {isExpanded ? (
              <>
                <IconChevronUp size={14} />
                Hide details
              </>
            ) : (
              <>
                <IconChevronDown size={14} />
                Show run details
              </>
            )}
          </button>
        )}
      </div>
      {isExpanded && hasRuns && (
        <div className="border-t border-neutral-200 dark:border-neutral-700">
          <AgentRunPanel taskId={task._id} />
        </div>
      )}

      <TaskDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        task={task}
      />
    </div>
  );
}
