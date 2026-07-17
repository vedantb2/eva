"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { UI_TASK_DESCRIPTION_HINT } from "@conductor/shared";
import { useRepo } from "@/lib/contexts/RepoContext";
import { MarkdownMentionText } from "@/lib/components/chat/MarkdownMentionText";
import {
  DescriptionMentionEditor,
  type DescriptionMentionEditorHandle,
} from "./DescriptionMentionEditor";
import { ReactionBar } from "./ReactionBar";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import { useReactions } from "./TaskReactionsProvider";
import { insertUiTaskDescriptionTemplate } from "../_utils/insertUiTaskDescription";

/**
 * Descriptions are authored and stored as Markdown. Legacy/imported content can
 * carry stray HTML (e.g. `<p>` wrappers from Linear) which Markdown should not
 * contain — strip those tags so they don't render literally, turning block tags
 * into line breaks. Non-tag angle brackets (e.g. `<3`) are preserved.
 */
function stripHtml(raw: string): string {
  return raw
    .replace(/<\/(p|div|li)>\s*/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function TaskDescription({
  description,
  canEditTaskText,
  taskId,
  inline: _inline,
}: {
  description: string | undefined;
  canEditTaskText: boolean;
  taskId: Id<"agentTasks">;
  /** Kept for call-site compatibility; description no longer uses a nested max-height scroll. */
  inline: boolean;
}) {
  const { basePath } = useRepo();
  const { groups, toggle } = useReactions("description", taskId);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stripHtml(description ?? ""));
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
          runAuditEnabled,
          providerAccountId,
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
            ...(runAuditEnabled !== undefined
              ? { runAuditEnabled: runAuditEnabled ?? undefined }
              : {}),
            ...(providerAccountId !== undefined
              ? { providerAccountId: providerAccountId ?? undefined }
              : {}),
          },
        );
      }
    },
  );

  const desc = stripHtml(description ?? "");

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
    <div className="group">
      <div
        onClick={handleClick}
        title={
          !isEditing && !canEditTaskText
            ? "Description can only be edited in To Do"
            : undefined
        }
        className={cn(
          "min-h-[1.5rem] overflow-x-hidden rounded px-2 py-1 -mx-2 -my-1",
          !isEditing && canEditTaskText && "cursor-pointer hover:bg-muted/50",
        )}
      >
        {isEditing ? (
          <div>
            <DescriptionMentionEditor
              ref={mentionRef}
              value={editValue}
              onValueChange={setEditValue}
              onBlur={handleSave}
              placeholder={`Add description... ${UI_TASK_DESCRIPTION_HINT}`}
              minHeight="min-h-[160px]"
              className="rounded-none border-0 px-0 py-0 shadow-none focus-visible:ring-0"
            />
            <button
              type="button"
              className="hit-target mt-1 inline-flex min-h-10 items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                setEditValue(insertUiTaskDescriptionTemplate(editValue))
              }
            >
              Add UI details
            </button>
          </div>
        ) : desc ? (
          <MarkdownMentionText
            text={desc}
            repoBasePath={basePath}
            className="text-sm text-muted-foreground break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
          />
        ) : (
          <p className="text-sm text-muted-foreground/60">
            {canEditTaskText ? "Click to add description..." : "No description"}
          </p>
        )}
      </div>

      {/* Reactions live outside the click-to-edit area so toggling a reaction
          never enters edit mode. Only shown when there's description content. */}
      {!isEditing && desc ? (
        <div className="mt-1.5">
          {groups.length > 0 ? (
            <ReactionBar groups={groups} toggle={toggle} />
          ) : (
            <EmojiReactionPicker
              onSelect={toggle}
              variant="ghost"
              alwaysVisible
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
