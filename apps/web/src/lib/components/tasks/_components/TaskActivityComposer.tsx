"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  cn,
} from "@conductor/ui";
import { IconArrowUp } from "@tabler/icons-react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  CommentMentionInput,
  type CommentMentionInputHandle,
} from "./CommentMentionInput";
import { DescriptionMentionEditor } from "./DescriptionMentionEditor";

interface TaskActivityComposerProps {
  taskId: Id<"agentTasks">;
  isProjectTask: boolean;
  requestingChanges: boolean;
  setRequestingChanges: (value: boolean) => void;
  executionError: string | null;
  setExecutionError: (value: string | null) => void;
  requestChangesBlockedReason: string | undefined;
  onRequestChangesSubmitted: () => void;
}

/** Comment / request-changes input above the task activity timeline. */
export function TaskActivityComposer({
  taskId,
  isProjectTask,
  requestingChanges,
  setRequestingChanges,
  executionError,
  setExecutionError,
  requestChangesBlockedReason,
  onRequestChangesSubmitted,
}: TaskActivityComposerProps) {
  const [commentText, setCommentText] = useState("");
  const mentionRef = useRef<CommentMentionInputHandle>(null);

  const createComment = useMutation(api.taskComments.create);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const updateStatus = useMutation(api.agentTasks.updateStatus);

  const tokenizeAndReset = (raw: string): string => {
    const tokenized = mentionRef.current?.tokenize(raw) ?? raw;
    mentionRef.current?.reset();
    return tokenized;
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    const content = tokenizeAndReset(text);
    setCommentText("");
    await createComment({ taskId, content });
  };

  const handleSubmitRequestChanges = async () => {
    const text = commentText.trim();
    if (!text) return;
    const content = tokenizeAndReset(text);
    setCommentText("");
    try {
      await createComment({ taskId, content });
      if (isProjectTask) {
        await updateStatus({ id: taskId, status: "todo" });
      } else {
        await startExecution({ id: taskId });
      }
      onRequestChangesSubmitted();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isProjectTask
            ? "Failed to queue changes"
            : "Failed to start execution";
      setExecutionError(message);
    }
  };

  const disabledReason = requestChangesBlockedReason;
  const canRequestChanges = disabledReason === undefined;
  const effectiveRequestingChanges = canRequestChanges && requestingChanges;
  const isMakeChangesGated = requestingChanges && !canRequestChanges;

  const clearExecutionError = () => {
    if (executionError) setExecutionError(null);
  };

  const editorClassName = cn(
    "min-h-24 max-h-44 pb-10 transition-[border-color,box-shadow]",
    requestingChanges && "border-primary focus-visible:ring-primary/40",
  );

  return (
    <div className="space-y-3 mb-6">
      {effectiveRequestingChanges && !executionError && (
        <p className="text-xs text-muted-foreground">
          {isProjectTask
            ? "Submitting will add your feedback and move this task to To Do. Use Build Project to run changes in order."
            : "Submitting will create a comment and re-run Eva with your changes"}
        </p>
      )}
      <div className="relative">
        {effectiveRequestingChanges ? (
          <DescriptionMentionEditor
            ref={mentionRef}
            value={commentText}
            onValueChange={(next) => {
              setCommentText(next);
              clearExecutionError();
            }}
            placeholder="Describe the changes you'd like Eva to make..."
            ariaLabel="Request changes comment"
            minHeight="min-h-24"
            className={cn("overflow-y-auto pr-12", editorClassName)}
          />
        ) : (
          <CommentMentionInput
            ref={mentionRef}
            value={commentText}
            onValueChange={(next) => {
              setCommentText(next);
              clearExecutionError();
            }}
            placeholder="Add a comment..."
            className={editorClassName}
          />
        )}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={effectiveRequestingChanges}
                  aria-label="Make changes"
                  disabled={!canRequestChanges}
                  onClick={() => {
                    setRequestingChanges(!requestingChanges);
                    clearExecutionError();
                  }}
                  className={cn(
                    "relative h-6 w-10 shrink-0 rounded-full transition-[background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    effectiveRequestingChanges ? "bg-primary" : "bg-muted",
                    !canRequestChanges && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-background transition-transform",
                      effectiveRequestingChanges ? "left-[18px]" : "left-0.5",
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "text-xs select-none",
                    canRequestChanges
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Make changes
                </span>
              </span>
            </TooltipTrigger>
            {disabledReason !== undefined && (
              <TooltipContent>{disabledReason}</TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="pointer-events-auto">
                <Button
                  size="icon"
                  className="rounded-full h-8 w-8"
                  disabled={!commentText.trim() || isMakeChangesGated}
                  onClick={
                    effectiveRequestingChanges
                      ? handleSubmitRequestChanges
                      : handleAddComment
                  }
                >
                  <IconArrowUp size={16} />
                </Button>
              </span>
            </TooltipTrigger>
            {isMakeChangesGated && disabledReason !== undefined && (
              <TooltipContent>{disabledReason}</TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
