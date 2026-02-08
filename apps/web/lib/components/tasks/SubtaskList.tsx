"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Checkbox, Input, Button } from "@conductor/ui";
import { IconPlus, IconSubtask, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

interface SubtaskListProps {
  taskId: Id<"agentTasks">;
  readOnly?: boolean;
}

export function SubtaskList({ taskId, readOnly }: SubtaskListProps) {
  const subtasks = useQuery(api.subtasks.listByTask, { parentTaskId: taskId });
  const createSubtask = useMutation(api.subtasks.create);
  const updateSubtask = useMutation(api.subtasks.update);
  const removeSubtask = useMutation(api.subtasks.remove);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = subtasks?.filter((s) => s.completed).length ?? 0;
  const totalCount = subtasks?.length ?? 0;

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    await createSubtask({
      parentTaskId: taskId,
      title: newSubtaskTitle.trim(),
    });
    setNewSubtaskTitle("");
    setIsAdding(false);
  };

  const handleToggleComplete = async (
    subtaskId: Id<"subtasks">,
    completed: boolean,
  ) => {
    await updateSubtask({ id: subtaskId, completed: !completed });
  };

  const handleRemove = async (subtaskId: Id<"subtasks">) => {
    await removeSubtask({ id: subtaskId });
  };

  if (subtasks === undefined) {
    return (
      <div className="text-sm text-muted-foreground">Loading subtasks...</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Subtasks
          {totalCount > 0 && (
            <span className="ml-2 text-muted-foreground">
              ({completedCount}/{totalCount})
            </span>
          )}
        </h4>
        {!isAdding && !readOnly && (
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(true)}>
            <IconPlus size={14} className="mr-1" />
            Add
          </Button>
        )}
      </div>

      {subtasks.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">No subtasks yet</p>
      )}

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask._id} className="flex items-center gap-2 group">
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() =>
                handleToggleComplete(subtask._id, subtask.completed)
              }
              className="h-3.5 w-3.5"
            />
            <span
              className={`flex-1 text-sm ${
                subtask.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
            >
              {subtask.title}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(subtask._id)}
            >
              <IconTrash size={14} className="text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="flex gap-2">
          <Input
            placeholder="Subtask title"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            autoFocus
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddSubtask();
              } else if (e.key === "Escape") {
                setIsAdding(false);
                setNewSubtaskTitle("");
              }
            }}
          />
          <Button size="sm" onClick={handleAddSubtask}>
            Add
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsAdding(false);
              setNewSubtaskTitle("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export function SubtaskProgress({ taskId }: { taskId: Id<"agentTasks"> }) {
  const subtasks = useQuery(api.subtasks.listByTask, { parentTaskId: taskId });

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
      <IconSubtask size={12} />
      <span className="text-xs text-muted-foreground">
        {completedCount}/{totalCount}
      </span>
    </div>
  );
}
