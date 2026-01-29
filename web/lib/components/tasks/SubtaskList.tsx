"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
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
    return <div className="text-sm text-default-400">Loading subtasks...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-default-700">
          Subtasks
          {totalCount > 0 && (
            <span className="ml-2 text-default-400">
              ({completedCount}/{totalCount})
            </span>
          )}
        </h4>
        {!isAdding && !readOnly && (
          <Button
            size="sm"
            variant="light"
            startContent={<IconPlus size={14} />}
            onPress={() => setIsAdding(true)}
          >
            Add
          </Button>
        )}
      </div>

      {subtasks.length === 0 && !isAdding && (
        <p className="text-sm text-default-400">No subtasks yet</p>
      )}

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask._id} className="flex items-center gap-2 group">
            <Checkbox
              isSelected={subtask.completed}
              onValueChange={() =>
                handleToggleComplete(subtask._id, subtask.completed)
              }
              size="sm"
            />
            <span
              className={`flex-1 text-sm ${
                subtask.completed
                  ? "text-default-400 line-through"
                  : "text-default-700"
              }`}
            >
              {subtask.title}
            </span>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onPress={() => handleRemove(subtask._id)}
            >
              <IconTrash size={14} className="text-danger" />
            </Button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="flex gap-2">
          <Input
            size="sm"
            placeholder="Subtask title"
            value={newSubtaskTitle}
            onValueChange={setNewSubtaskTitle}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddSubtask();
              } else if (e.key === "Escape") {
                setIsAdding(false);
                setNewSubtaskTitle("");
              }
            }}
          />
          <Button size="sm" color="primary" onPress={handleAddSubtask}>
            Add
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => {
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
    <div className="flex items-center gap-1 text-xs text-default-400 ml-auto">
      <IconSubtask size={12} />
      <span className="text-xs text-default-400">
        {completedCount}/{totalCount}
      </span>
    </div>
  );
}
