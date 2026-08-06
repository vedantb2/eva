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
  ModelSelect,
} from "@eva/ui";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { api, normalizeAIModel } from "@eva/backend";
import type { Id } from "@eva/backend";
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
import {
  useAvailableAiModels,
  useTaskOwnerProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { canEditTaskModel } from "./task-detail-constants";

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

const COMMENT_EDITOR_CLASS =
  "min-h-24 max-h-44 rounded-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:ring-0 transition-[background-color]";

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
  // Per-run proof/audit choice for project change requests. Transient (default
  // off, reset after submit) so a change request never repeats these steps
  // unless explicitly asked for this run.
  const [captureProof, setCaptureProof] = useState(false);
  const [runAudit, setRunAudit] = useState(false);
  const mentionRef = useRef<CommentMentionInputHandle>(null);

  const createComment = useMutation(api.taskComments.create);
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const updateTask = useMutation(api.agentTasks.update);

  const currentUserId = useQuery(api.auth.me);
  const task = useQuery(api.agentTasks.get, { id: taskId });
  const currentModel = normalizeAIModel(task?.model);
  const { options: modelOptions } = useAvailableAiModels(
    task?.repoId,
    currentModel,
  );
  const { options: accounts, resolveId: resolveAccountId } =
    useTaskOwnerProviderAccounts(taskId);
  const isOwner =
    currentUserId !== undefined &&
    task?.createdBy !== undefined &&
    currentUserId === task.createdBy;
  const canEditModel = canEditTaskModel(task?.status);
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
    }
    setIsSubmitting(false);
  };

  // Quick tasks: comment-only composer (no Make changes / model / options).
  if (!isProjectTask) {
    return (
      <div className="relative space-y-3">
        <TypingIndicator
          users={typingUsers}
          className="absolute bottom-full left-0 mb-1"
        />
        <div className="overflow-hidden rounded-surface border border-input bg-card transition-[border-color,box-shadow] focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/35">
          <CommentMentionInput
            ref={mentionRef}
            value={commentText}
            onValueChange={handleValueChange}
            placeholder="Add a comment..."
            initialMentionMap={initialMentionMap}
            initialSkillMap={initialSkillMap}
            className={COMMENT_EDITOR_CLASS}
          />
          <div className="flex items-center justify-end gap-2 px-2 pb-2">
            <CommentSendButton
              size="icon-sm"
              disabled={!commentText.trim() || isSubmitting}
              isSubmitting={isSubmitting}
              onClick={handleAddComment}
              ariaLabel="Add comment"
            />
          </div>
        </div>
      </div>
    );
  }

  const handleSubmitRequestChanges = async () => {
    const text = commentText.trim();
    if (!text || isSubmitting) return;
    const content = tokenizeAndReset(text);
    setCommentText("");
    clearDraft();
    stopTyping();
    setIsSubmitting(true);
    try {
      await createComment({
        taskId,
        content,
        requestsChanges: true,
      });
      // No immediate run — persist proof/audit on the task so the next
      // Build Project / ordered run picks them up.
      await updateTask({
        id: taskId,
        screenshotsVideosEnabled: captureProof,
        runAuditEnabled: runAudit,
      });
      await updateStatus({ id: taskId, status: "todo" });
      setCaptureProof(false);
      setRunAudit(false);
      onRequestChangesSubmitted();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to queue changes";
      setExecutionError(message);
    }
    setIsSubmitting(false);
  };

  const disabledReason = requestChangesBlockedReason;
  const canRequestChanges = disabledReason === undefined;
  const effectiveRequestingChanges = canRequestChanges && requestingChanges;
  const isMakeChangesGated = requestingChanges && !canRequestChanges;
  const changeRequestOptionCount = (captureProof ? 1 : 0) + (runAudit ? 1 : 0);

  const editorClassName = COMMENT_EDITOR_CLASS;

  return (
    <div className="relative space-y-3">
      <TypingIndicator
        users={typingUsers}
        className="absolute bottom-full left-0 mb-1"
      />
      {effectiveRequestingChanges && !executionError && (
        <p className="text-xs text-muted-foreground">
          Submitting will add your feedback and move this task to To Do. Use
          Build Project to run changes in order.
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
            completionContext={`a description of further changes to request from an AI coding agent${task?.title ? ` on the task "${task.title}"` : ""}`}
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
                      "relative h-6 w-10 shrink-0 rounded-full transition-[background-color] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <ModelSelect
                    value={currentModel}
                    options={modelOptions}
                    onValueChange={() => undefined}
                    accounts={accounts}
                    accountId={task?.providerAccountId ?? null}
                    onSelectionChange={(nextModel, nextAccountId) => {
                      if (!canEditModel) return;
                      if (isOwner) {
                        updateTask({
                          id: taskId,
                          model: nextModel,
                          providerAccountId:
                            resolveAccountId(nextAccountId) ?? null,
                        });
                        return;
                      }
                      updateTask({ id: taskId, model: nextModel });
                    }}
                    canSelectTeamWhilePersonal={isOwner}
                    disabled={!effectiveRequestingChanges || !canEditModel}
                    className={cn(
                      "h-6 max-w-44",
                      (!effectiveRequestingChanges || !canEditModel) &&
                        "opacity-50",
                    )}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {!canEditModel
                  ? "Locked when the task is done or cancelled"
                  : effectiveRequestingChanges
                    ? "Model for this task (saved on change)"
                    : "Turn on Make changes to pick a model"}
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <DropdownMenuTrigger
                      asChild
                      disabled={!effectiveRequestingChanges}
                    >
                      <button
                        type="button"
                        disabled={!effectiveRequestingChanges}
                        className={cn(
                          "relative flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
                          !effectiveRequestingChanges
                            ? "cursor-not-allowed text-muted-foreground opacity-50"
                            : "hover:bg-muted hover:text-foreground",
                          effectiveRequestingChanges &&
                            (captureProof || runAudit)
                            ? "text-foreground"
                            : effectiveRequestingChanges
                              ? "text-muted-foreground"
                              : null,
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
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {effectiveRequestingChanges
                    ? "Extra steps for the next project build of this task"
                    : "Turn on Make changes to set proof/audit"}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Extra steps on next build</DropdownMenuLabel>
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
