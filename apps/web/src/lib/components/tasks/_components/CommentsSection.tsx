"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  Button,
  Checkbox,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import dayjs from "@conductor/shared/dates";
import { IconTrash, IconArrowUp, IconLoader2 } from "@tabler/icons-react";
import {
  CommentMentionInput,
  type CommentMentionInputHandle,
} from "./CommentMentionInput";
import { MentionText } from "@/lib/components/mentions";

interface CommentsSectionProps {
  taskId: Id<"agentTasks">;
  comments: FunctionReturnType<typeof api.taskComments.listByTask> | undefined;
  hasActiveRun: boolean;
  hasRuns: boolean;
  isOwner: boolean;
  requestingChanges: boolean;
  setRequestingChanges: (v: boolean) => void;
  executionError: string | null;
  setExecutionError: (v: string | null) => void;
  onRequestChangesSubmitted: () => void;
}

export function CommentsSection({
  taskId,
  comments,
  hasActiveRun,
  hasRuns,
  isOwner,
  requestingChanges,
  setRequestingChanges,
  executionError,
  setExecutionError,
  onRequestChangesSubmitted,
}: CommentsSectionProps) {
  const [commentText, setCommentText] = useState("");
  const [deletingCommentId, setDeletingCommentId] =
    useState<Id<"taskComments"> | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const mentionRef = useRef<CommentMentionInputHandle>(null);

  const createComment = useMutation(api.taskComments.create);
  const removeComment = useMutation(api.taskComments.remove);
  const startExecution = useMutation(api.agentTasks.startExecution);

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
      await startExecution({ id: taskId });
      onRequestChangesSubmitted();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start execution";
      setExecutionError(message);
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingCommentId) return;
    setIsDeletingComment(true);
    try {
      await removeComment({ id: deletingCommentId });
      setDeletingCommentId(null);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    } finally {
      setIsDeletingComment(false);
    }
  };

  const sortedComments = comments ? [...comments].reverse() : undefined;
  const disabledReason: string | undefined = hasActiveRun
    ? "Wait for the current run to finish"
    : !hasRuns
      ? "Run Eva on this task before requesting changes"
      : undefined;
  const canRequestChanges = disabledReason === undefined;
  const effectiveRequestingChanges = canRequestChanges && requestingChanges;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <CommentMentionInput
            ref={mentionRef}
            value={commentText}
            onValueChange={(next) => {
              setCommentText(next);
              if (executionError) setExecutionError(null);
            }}
            placeholder={
              effectiveRequestingChanges
                ? "Describe the changes you'd like Eva to make..."
                : "Add a comment..."
            }
          />
          <Button
            size="icon"
            className="rounded-full absolute right-2 bottom-2 h-8 w-8"
            disabled={!commentText.trim()}
            onClick={
              effectiveRequestingChanges
                ? handleSubmitRequestChanges
                : handleAddComment
            }
          >
            <IconArrowUp size={16} />
          </Button>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 w-fit">
              <Checkbox
                id={`task-make-changes-${taskId}`}
                checked={effectiveRequestingChanges}
                disabled={!canRequestChanges}
                onCheckedChange={(checked) => {
                  setRequestingChanges(checked === true);
                  if (executionError) setExecutionError(null);
                }}
              />
              <Label
                htmlFor={`task-make-changes-${taskId}`}
                className={!canRequestChanges ? "text-muted-foreground" : ""}
              >
                Make changes
              </Label>
            </div>
          </TooltipTrigger>
          {disabledReason !== undefined && (
            <TooltipContent>{disabledReason}</TooltipContent>
          )}
        </Tooltip>
        {effectiveRequestingChanges && !executionError && (
          <p className="text-xs text-muted-foreground">
            Submitting will create a comment and re-run Eva with your changes
          </p>
        )}
      </div>
      {sortedComments && sortedComments.length > 0 && (
        <div className="space-y-3">
          {sortedComments.map((comment) => (
            <div
              key={comment._id}
              className="rounded-lg bg-muted/40 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {comment.authorId && (
                    <UserInitials
                      userId={comment.authorId}
                      hideLastSeen
                      size="sm"
                    />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {dayjs(comment.createdAt).fromNow()}
                  </span>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive relative after:absolute after:inset-[-8px]"
                  onClick={() => setDeletingCommentId(comment._id)}
                >
                  <IconTrash size={12} />
                </Button>
              </div>
              <MentionText text={comment.content} />
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={deletingCommentId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingCommentId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this comment? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingCommentId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteComment}
              disabled={isDeletingComment}
            >
              {isDeletingComment && (
                <IconLoader2 size={16} className="animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
