"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import {
  DescriptionMentionEditor,
  type DescriptionMentionEditorHandle,
} from "./DescriptionMentionEditor";

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
  const { basePath } = useRepo();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description ?? "");
  const mentionRef = useRef<DescriptionMentionEditorHandle>(null);

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

  useEffect(() => {
    if (!isEditing) {
      setEditValue(desc);
    }
  }, [desc, isEditing]);

  const handleSave = useCallback(() => {
    const tokenized = mentionRef.current?.tokenize(editValue) ?? editValue;
    const trimmed = tokenized.trim();
    if (canEditTaskText && trimmed !== desc) {
      updateTask({ id: taskId, description: trimmed });
    }
    setIsEditing(false);
  }, [canEditTaskText, desc, editValue, taskId, updateTask]);

  const handleClick = useCallback(() => {
    if (!isEditing && canEditTaskText) {
      setEditValue(desc);
      setIsEditing(true);
    }
  }, [isEditing, canEditTaskText, desc]);

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
      {isEditing ? (
        <DescriptionMentionEditor
          ref={mentionRef}
          value={editValue}
          onValueChange={setEditValue}
          onBlur={handleSave}
          placeholder="Add description..."
          minHeight="min-h-[160px]"
          className="border-0 px-0 py-0 shadow-none focus-visible:ring-0"
        />
      ) : desc ? (
        <MessageMentionText
          text={desc}
          repoBasePath={basePath}
          className="text-sm text-muted-foreground whitespace-pre-wrap break-words"
        />
      ) : (
        <p className="text-sm text-muted-foreground/60">
          {canEditTaskText ? "Click to add description..." : "No description"}
        </p>
      )}
    </div>
  );
}
