"use client";

import { useState, useCallback } from "react";
import { cn } from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { MarkdownEditor } from "./MarkdownEditor";

export function TaskDescription({
  description,
  canEditTaskText,
  taskId,
  inline,
}: {
  description: string | undefined;
  canEditTaskText: boolean;
  taskId: Id<"agentTasks">;
  inline: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const updateTask = useMutation(api.agentTasks.update).withOptimisticUpdate(
    (localStore, args) => {
      const cached = localStore.getQuery(api.agentTasks.get, { id: taskId });
      if (cached) {
        const {
          id: _id,
          priority,
          projectId,
          assignedTo,
          screenshotsVideosEnabled,
          ...safeFields
        } = args;
        localStore.setQuery(
          api.agentTasks.get,
          { id: taskId },
          {
            ...cached,
            ...safeFields,
            ...(priority !== undefined
              ? { priority: priority ?? undefined }
              : {}),
            ...(projectId !== undefined
              ? { projectId: projectId ?? undefined }
              : {}),
            ...(assignedTo !== undefined
              ? { assignedTo: assignedTo ?? undefined }
              : {}),
            ...(screenshotsVideosEnabled !== undefined
              ? {
                  screenshotsVideosEnabled:
                    screenshotsVideosEnabled ?? undefined,
                }
              : {}),
          },
        );
      }
    },
  );

  const desc = description ?? "";

  const handleSave = useCallback(
    (markdown: string) => {
      const trimmed = markdown.trim();
      if (canEditTaskText && trimmed !== desc) {
        updateTask({ id: taskId, description: trimmed });
      }
      setIsEditing(false);
    },
    [canEditTaskText, desc, taskId, updateTask],
  );

  const handleClick = useCallback(() => {
    if (!isEditing && canEditTaskText) {
      setIsEditing(true);
    }
  }, [isEditing, canEditTaskText]);

  return (
    <div
      onClick={handleClick}
      title={
        !isEditing && !canEditTaskText
          ? "Description can only be edited in To Do"
          : undefined
      }
      className={cn(
        "min-h-[1.5rem] overflow-x-hidden rounded px-2 py-1 -mx-2 -my-1",
        inline && !isEditing && "max-h-[40vh] overflow-y-auto scrollbar",
        !isEditing && canEditTaskText && "cursor-pointer hover:bg-muted/50",
      )}
    >
      <MarkdownEditor
        content={desc}
        editable={isEditing}
        placeholder={
          canEditTaskText ? "Click to add description..." : undefined
        }
        onBlur={handleSave}
        className="text-sm text-muted-foreground"
      />
    </div>
  );
}
