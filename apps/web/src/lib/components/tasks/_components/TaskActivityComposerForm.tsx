"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  cn,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@conductor/ui";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { tokenizedToEditable } from "@/lib/components/mentions";
import {
  CommentMentionInput,
  type CommentMentionInputHandle,
} from "./CommentMentionInput";
import { DescriptionMentionEditor } from "./DescriptionMentionEditor";
import { CommentSendButton } from "./CommentSendButton";
import { useDraftAutosave } from "@/lib/hooks/useDraftAutosave";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useTypingPresence } from "@/lib/hooks/useTypingPresence";
import { TypingIndicator } from "@/lib/components/chat/TypingIndicator";

export interface TaskActivityComposerFormProps {
  taskId: Id<"agentTasks">;
  isProjectTask: boolean;
  requestingChanges: boolean;
  setRequestingChanges: (value: boolean) => void;
  executionError: string | null;
  setExecutionError: (value: string | null) => void;
  requestChangesBlockedReason: string | undefined;
  onRequestChangesSubmitted: () => void;
  initialContent: string | null;
}

// Inner form — mounts only once the draft has resolved. Seeds text and maps
// from the draft initializer so there is no hydration useEffect.
export function TaskActivityComposerForm({
  taskId,
  isProjectTask,
  requestingChanges,
  setRequestingChanges,
  executionError,
  setExecutionError,
  requestChangesBlockedReason,
  onRequestChangesSubmitted,
  initialContent,
}: TaskActivityComposerFormProps) {
  // Seed text + maps from draft once, via useState initializer.
  const [
    {
      displayText: initialText,
      mentionMap: initialMentionMap,
      skillMap: initialSkillMap,
    },
  ] = useState(() => tokenizedToEditable(initialContent ?? ""));

  const [commentText, setCommentText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Per-run proof/audit choice for this change request. Transient (default off,
  // reset after submit) so a change request never repeats these steps unless
  // explicitly asked for this run.
  const [captureProof, setCaptureProof] = useState(false);
  const [runAudit, setRunAudit] = useState(false);
  const mentionRef = useRef<CommentMentionInputHandle>(null);

  const createComment = useMutation(api.taskComments.create);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const updateStatus = useMutation(api.agentTasks.updateStatus);

  const currentUserId = useQuery(api.auth.me);
  const { typingUsers, onActivity, stopTyping } = useTypingPresence(
    `typing:task:${taskId}`,
    currentUserId,
  );

  const { save: saveDraft, clear: clearDraft } = useDraftAutosave(
    { kind: "taskComment", taskId },
    mentionRef,
  );

  const clearExecutionError = () => {
    if (executionError) setExecutionError(null);
  };

  const handleValueChange = (next: string) => {
    setCommentText(next);
    clearExecutionError();
    saveDraft(next);
    onActivity();
  };

  const tokenizeAndReset = (raw: string): string => {
    const tokenized = mentionRef.current?.tokenize(raw) ?? raw;
    mentionRef.current?.reset();
    return tokenized;
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || isSubmitting) return;
    const content = tokenizeAndReset(text);
    setCommentText("");
    clearDraft();
    stopTyping();
    setIsSubmitting(true);
    try {
      await createComment({ taskId, content });
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRequestChanges = async () => {
    const text = commentText.trim();
    if (!text || isSubmitting) return;
    const content = tokenizeAndReset(text);
    setCommentText("");
    clearDraft();
    stopTyping();
    setIsSubmitting(true);
    try {
      const commentId = await createComment({
        taskId,
        content,
        requestsChanges: true,
      });
      if (isProjectTask) {
        await updateStatus({ id: taskId, status: "todo" });
      } else {
        await startExecution({
          id: taskId,
          triggeringCommentId: commentId,
          screenshotsVideosEnabled: captureProof,
          runAuditEnabled: runAudit,
        });
      }
      setCaptureProof(false);
      setRunAudit(false);
      onRequestChangesSubmitted();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isProjectTask
            ? "Failed to queue changes"
            : "Failed to start execution";
      setExecutionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabledReason = requestChangesBlockedReason;
  const canRequestChanges = disabledReason === undefined;
  const effectiveRequestingChanges = canRequestChanges && requestingChanges;
  const isMakeChangesGated = requestingChanges && !canRequestChanges;
  const changeRequestOptionCount = (captureProof ? 1 : 0) + (runAudit ? 1 : 0);

  // Mirror the sessions/sandbox chat composer (PromptInput): a bordered card
  // wraps a borderless input with a footer row of controls, rather than
  // floating controls over the textarea.
  const editorClassName =
    "min-h-9 max-h-44 rounded-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:ring-0 transition-[background-color]";

  return (
    <div className="relative space-y-3">
      <TypingIndicator
        users={typingUsers}
        className="absolute bottom-full left-0 mb-1"
      />
      {effectiveRequestingChanges && !executionError && (
        <p className="text-xs text-muted-foreground">
          {isProjectTask
            ? "Submitting will add your feedback and move this task to To Do. Use Build Project to run changes in order."
            : "Submitting will create a comment and re-run Eva with your changes"}
        </p>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-surface border border-input bg-card transition-[border-color,box-shadow] focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/35",
          requestingChanges &&
            "border-primary focus-within:border-primary focus-within:ring-primary/35",
        )}
      >
        {effectiveRequestingChanges ? (
          <DescriptionMentionEditor
            ref={mentionRef}
            value={commentText}
            onValueChange={handleValueChange}
            placeholder="Describe the changes you'd like Eva to make..."
            ariaLabel="Request changes comment"
            minHeight="min-h-24"
            initialMentionMap={initialMentionMap}
            initialSkillMap={initialSkillMap}
            className={cn("overflow-y-auto", editorClassName)}
          />
        ) : (
          <CommentMentionInput
            ref={mentionRef}
            value={commentText}
            onValueChange={handleValueChange}
            placeholder="Add a comment..."
            initialMentionMap={initialMentionMap}
            initialSkillMap={initialSkillMap}
            className={editorClassName}
          />
        )}
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-2">
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
                        "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
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
            {/* Always visible for quick tasks — applies only when Make changes
                submits a re-run. Was gated on Make changes and easy to miss. */}
            {!isProjectTask && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "relative flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors hover:bg-muted hover:text-foreground",
                          captureProof || runAudit
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                        aria-label={
                          changeRequestOptionCount > 0
                            ? `Change-request options, ${changeRequestOptionCount} enabled`
                            : "Change-request options"
                        }
                      >
                        <IconAdjustmentsHorizontal className="size-3.5" />
                        Options
                        {changeRequestOptionCount > 0 ? (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground">
                            {changeRequestOptionCount}
                          </span>
                        ) : null}
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    {effectiveRequestingChanges
                      ? "Extra steps for this change request"
                      : "Extra steps when you Make changes"}
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Extra steps this run</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={captureProof}
                    onCheckedChange={(checked) =>
                      setCaptureProof(checked === true)
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    Capture proof
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={runAudit}
                    onCheckedChange={(checked) => setRunAudit(checked === true)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    Run audit
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <CommentSendButton
                  size="icon-sm"
                  disabled={
                    !commentText.trim() || isMakeChangesGated || isSubmitting
                  }
                  isSubmitting={isSubmitting}
                  onClick={
                    effectiveRequestingChanges
                      ? handleSubmitRequestChanges
                      : handleAddComment
                  }
                  ariaLabel={
                    effectiveRequestingChanges
                      ? "Submit changes"
                      : "Add comment"
                  }
                />
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
