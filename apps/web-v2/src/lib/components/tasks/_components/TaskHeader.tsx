"use client";

import { useState } from "react";
import { Input } from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

export function TaskHeader({
  taskNumber,
  title,
  canEditTaskText,
  taskId,
}: {
  taskNumber: number | undefined;
  title: string | undefined;
  canEditTaskText: boolean;
  taskId: Id<"agentTasks">;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const updateTask = useMutation(api.agentTasks.update);

  return (
    <div className="flex items-center gap-2">
      {taskNumber && (
        <span className="text-muted-foreground font-mono">#{taskNumber}</span>
      )}
      {isEditingTitle ? (
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => {
            const trimmed = editTitle.trim();
            if (canEditTaskText && trimmed && trimmed !== title) {
              updateTask({ id: taskId, title: trimmed });
            }
            setIsEditingTitle(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setIsEditingTitle(false);
            }
          }}
          autoFocus
          className="flex-1 text-xl font-semibold h-auto px-1 -mx-1 py-0 border-none shadow-none focus-visible:ring-0 bg-muted/50 rounded"
        />
      ) : (
        <span
          onClick={() => {
            if (canEditTaskText) {
              setEditTitle(title ?? "");
              setIsEditingTitle(true);
            }
          }}
          title={
            canEditTaskText ? undefined : "Title can only be edited in To Do"
          }
          className={
            !canEditTaskText
              ? "text-xl font-semibold"
              : "text-xl font-semibold cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
          }
        >
          {title}
        </span>
      )}
    </div>
  );
}
