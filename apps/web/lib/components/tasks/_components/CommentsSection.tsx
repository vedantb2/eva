"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  Button,
  Checkbox,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import dayjs from "@conductor/shared/dates";
import { IconTrash, IconArrowUp, IconLoader2 } from "@tabler/icons-react";

interface CommentsSectionProps {
  taskId: Id<"agentTasks">;
  comments: FunctionReturnType<typeof api.taskComments.listByTask> | undefined;
  status: string | undefined;
  hasActiveRun: boolean;
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
  status,
  hasActiveRun,
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

  const createComment = useMutation(api.taskComments.create);
  const removeComment = useMutation(api.taskComments.remove);
  const startExecution = useMutation(api.agentTasks.startExecution);

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    await createComment({ taskId, content: text });
  };

  const handleSubmitRequestChanges = async () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    setRequestingChanges(false);
    try {
      await createComment({ taskId, content: text });
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

  return (
    <div className="space-y-4">
      {comments && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="rounded-lg border border-border p-3 space-y-2"
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
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeletingCommentId(comment._id)}
                >
                  <IconTrash size={12} />
                </Button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
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
      {(status === "business_review" ||
        status === "code_review" ||
        status === "done" ||
        status === "cancelled") && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`task-make-changes-${taskId}`}
            checked={requestingChanges}
            disabled={Boolean(hasActiveRun)}
            onCheckedChange={(checked) => {
              setRequestingChanges(checked === true);
              if (executionError) setExecutionError(null);
            }}
          />
          <Label
            htmlFor={`task-make-changes-${taskId}`}
            className={hasActiveRun ? "text-muted-foreground" : ""}
          >
            Make changes
          </Label>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <Textarea
          rows={3}
          placeholder={
            requestingChanges
              ? "Describe the changes you'd like Eva to make..."
              : "Add a comment..."
          }
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
            if (executionError) setExecutionError(null);
          }}
          className="flex-1"
        />
        <Button
          size="icon"
          className="rounded-full shrink-0"
          disabled={!commentText.trim()}
          onClick={
            requestingChanges ? handleSubmitRequestChanges : handleAddComment
          }
        >
          <IconArrowUp size={18} />
        </Button>
      </div>
      {requestingChanges && !executionError && (
        <p className="text-xs text-muted-foreground">
          Submitting will create a comment and re-run Eva with your changes
        </p>
      )}
    </div>
  );
}
