"use client";

import { Checkbox } from "@heroui/checkbox";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { formatSubtaskNumber } from "@/lib/utils/subtaskNumber";

interface SubtaskListProps {
  parentTaskId: Id<"agentTasks">;
  parentTaskNumber: number;
}

export function SubtaskList({
  parentTaskId,
  parentTaskNumber,
}: SubtaskListProps) {
  const subtasks = useQuery(api.subtasks.listByTask, { parentTaskId });
  const updateSubtask = useMutation(api.subtasks.update);

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <div key={subtask._id} className="flex items-center gap-2">
          <Checkbox
            isSelected={subtask.completed}
            onValueChange={(checked) =>
              updateSubtask({ id: subtask._id, completed: checked })
            }
            size="sm"
          >
            <span className="text-default-400 font-mono text-xs mr-1">
              {formatSubtaskNumber(parentTaskNumber, subtask.order)}
            </span>
            <span
              className={`text-sm ${
                subtask.completed ? "line-through text-default-400" : ""
              }`}
            >
              {subtask.title}
            </span>
          </Checkbox>
        </div>
      ))}
    </div>
  );
}
