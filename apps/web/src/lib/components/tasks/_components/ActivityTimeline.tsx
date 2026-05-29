"use client";

import { lazy, Suspense, useRef, useState } from "react";
import { useMutation } from "convex/react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Spinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  cn,
} from "@conductor/ui";
import { IconArrowUp, IconLoader2 } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { AuditTimelineItem } from "./AuditTimelineItem";
import { TaskActivityItem } from "./TaskActivityItem";
import {
  CommentMentionInput,
  type CommentMentionInputHandle,
} from "./CommentMentionInput";
import { DescriptionMentionEditor } from "./DescriptionMentionEditor";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";
import { CommentThread } from "./CommentThread";
import {
  buildRepliesByParentId,
  DELETED_COMMENT_PLACEHOLDER,
  getTopLevelComments,
} from "../_utils/commentThread";

const RunTimelineItem = lazy(() =>
  import("./RunTimelineItem").then((m) => ({ default: m.RunTimelineItem })),
);

type Runs = FunctionReturnType<typeof api.agentRuns.listByTask>;
type Audits = FunctionReturnType<typeof api.audits.listByTask>;
type Comments = FunctionReturnType<typeof api.taskComments.listByTask>;
type Comment = NonNullable<Comments>[number];
type Streaming = FunctionReturnType<typeof api.streaming.get>;
type SandboxEvents = FunctionReturnType<
  typeof api.taskSandboxEvents.listByTask
>;
type SandboxEvent = NonNullable<SandboxEvents>[number];
type TaskActivity = FunctionReturnType<typeof api.taskActivity.listByTask>;
type TaskActivityEvent = NonNullable<TaskActivity>[number];
type Users = FunctionReturnType<typeof api.users.listAll>;

type ActivityItem =
  | {
      kind: "audit";
      timestamp: number;
      audit: NonNullable<Audits>[number];
    }
  | {
      kind: "run";
      timestamp: number;
      run: NonNullable<Runs>[number];
    }
  | {
      kind: "sandboxEvent";
      timestamp: number;
      event: SandboxEvent;
    }
  | {
      kind: "taskActivity";
      timestamp: number;
      activity: TaskActivityEvent;
    }
  | {
      kind: "comment";
      timestamp: number;
      comment: Comment;
    };

function sandboxEventLabel(event: SandboxEvent["event"]): string {
  switch (event) {
    case "started":
      return "Sandbox started";
    case "reconnected":
      return "Sandbox reconnected";
    case "stopped":
      return "Sandbox stopped";
    case "stop_failed":
      return "Failed to stop sandbox";
    case "failed":
      return "Failed to start sandbox";
  }
}

export function ActivityTimeline({
  taskId,
  runs,
  allAudits,
  comments,
  sandboxEvents,
  taskActivity,
  users,
  streaming,
  auditStreaming,
  activeRunElapsed,
  auditElapsed,
  fixElapsed,
  isStopping,
  onStopConfirm,
  hasActiveRun,
  requestChangesBlockedReason,
  hasRuns,
  isOwner,
  requestingChanges,
  setRequestingChanges,
  executionError,
  setExecutionError,
  onRequestChangesSubmitted,
  isProjectTask,
}: {
  taskId: Id<"agentTasks">;
  isProjectTask: boolean;
  runs: Runs | undefined;
  allAudits: Audits | undefined;
  comments: Comments | undefined;
  sandboxEvents: SandboxEvents | undefined;
  taskActivity: TaskActivity | undefined;
  users: Users | undefined;
  streaming: Streaming | undefined;
  auditStreaming: Streaming | undefined;
  activeRunElapsed: number;
  auditElapsed: number;
  fixElapsed: number;
  isStopping: boolean;
  onStopConfirm: () => void;
  hasActiveRun: boolean;
  requestChangesBlockedReason: string | undefined;
  hasRuns: boolean;
  isOwner: boolean;
  requestingChanges: boolean;
  setRequestingChanges: (v: boolean) => void;
  executionError: string | null;
  setExecutionError: (v: string | null) => void;
  onRequestChangesSubmitted: () => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [deletingCommentId, setDeletingCommentId] =
    useState<Id<"taskComments"> | null>(null);
  const [replyingToId, setReplyingToId] = useState<Id<"taskComments"> | null>(
    null,
  );
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const mentionRef = useRef<CommentMentionInputHandle>(null);

  const createComment = useMutation(api.taskComments.create);
  const removeComment = useMutation(
    api.taskComments.remove,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.taskComments.listByTask, {
      taskId,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.taskComments.listByTask,
        { taskId },
        current.map((entry) =>
          entry._id === args.id
            ? {
                ...entry,
                deletedAt: Date.now(),
                content: DELETED_COMMENT_PLACEHOLDER,
              }
            : entry,
        ),
      );
    }
  });
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

  const disabledReason = requestChangesBlockedReason;
  const canRequestChanges = disabledReason === undefined;
  const effectiveRequestingChanges = canRequestChanges && requestingChanges;
  const isMakeChangesGated = requestingChanges && !canRequestChanges;

  const sortedRuns = [...(runs ?? [])].sort(
    (a, b) =>
      (a.startedAt ?? a._creationTime) - (b.startedAt ?? b._creationTime),
  );
  const firstRunId = sortedRuns.length > 0 ? sortedRuns[0]._id : null;

  const userComments = comments?.filter((c) => c.authorId) ?? [];
  const topLevelComments = getTopLevelComments(userComments);
  const repliesByParentId = buildRepliesByParentId(userComments);

  const runCommentMap = new Map<string, (typeof topLevelComments)[number]>();
  if (topLevelComments.length > 0 && runs) {
    const sortedComments = [...topLevelComments].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    for (const run of sortedRuns) {
      if (run._id === firstRunId) continue;
      const runTime = run._creationTime;
      let matchedComment: (typeof topLevelComments)[number] | undefined;
      for (const comment of sortedComments) {
        if (comment.createdAt <= runTime) {
          matchedComment = comment;
        }
      }
      if (matchedComment) {
        runCommentMap.set(run._id, matchedComment);
      }
    }
  }

  const commentsShownWithRuns = new Set(
    [...runCommentMap.values()].map((comment) => comment._id),
  );

  const sortedRunsDesc = [...(runs ?? [])].sort(
    (a, b) =>
      (b.startedAt ?? b._creationTime) - (a.startedAt ?? a._creationTime),
  );

  const activityTimeline: ActivityItem[] = [
    ...(allAudits ?? []).map((audit) => ({
      kind: "audit" as const,
      timestamp: audit.createdAt,
      audit,
    })),
    ...sortedRunsDesc.map((run) => ({
      kind: "run" as const,
      timestamp: run.startedAt ?? run._creationTime,
      run,
    })),
    ...(sandboxEvents ?? []).map((event) => ({
      kind: "sandboxEvent" as const,
      timestamp: event.createdAt,
      event,
    })),
    ...(taskActivity ?? []).map((activity) => ({
      kind: "taskActivity" as const,
      timestamp: activity.createdAt,
      activity,
    })),
    ...topLevelComments
      .filter((comment) => !commentsShownWithRuns.has(comment._id))
      .map((comment) => ({
        kind: "comment" as const,
        timestamp: comment.createdAt,
        comment,
      })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="pt-4">
      <div className="space-y-3 mb-6">
        <div className="relative">
          {effectiveRequestingChanges ? (
            <DescriptionMentionEditor
              ref={mentionRef}
              value={commentText}
              onValueChange={(next) => {
                setCommentText(next);
                if (executionError) setExecutionError(null);
              }}
              placeholder="Describe the changes you'd like Eva to make..."
              ariaLabel="Request changes comment"
              minHeight="min-h-24"
              className={cn(
                "max-h-44 overflow-y-auto pr-12 transition-[border-color,box-shadow]",
                requestingChanges &&
                  "border-primary focus-visible:ring-primary/40",
              )}
            />
          ) : (
            <CommentMentionInput
              ref={mentionRef}
              value={commentText}
              onValueChange={(next) => {
                setCommentText(next);
                if (executionError) setExecutionError(null);
              }}
              placeholder="Add a comment..."
              className={cn(
                "min-h-24 max-h-44 transition-[border-color,box-shadow]",
                requestingChanges &&
                  "border-primary focus-visible:ring-primary/40",
              )}
            />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute right-2 bottom-2">
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
            {isProjectTask
              ? "Submitting will add your feedback and move this task to To Do. Use Build Project to run changes in order."
              : "Submitting will create a comment and re-run Eva with your changes"}
          </p>
        )}
      </div>

      {activityTimeline.length > 0 && (
        <div className="space-y-4">
          {activityTimeline.map((item, index) => {
            if (item.kind === "audit") {
              const audit = item.audit;
              const auditIndex = (allAudits ?? []).indexOf(audit);
              const isLatest = auditIndex === 0;
              return (
                <AuditTimelineItem
                  key={`audit-${audit._id}`}
                  audit={audit}
                  isLatest={isLatest}
                  isFirst={index === 0}
                  auditStreaming={auditStreaming}
                  auditElapsed={auditElapsed}
                  fixElapsed={fixElapsed}
                />
              );
            }
            if (item.kind === "taskActivity") {
              return (
                <TaskActivityItem
                  key={`activity-${item.activity._id}`}
                  event={item.activity}
                  users={users}
                />
              );
            }
            if (item.kind === "sandboxEvent") {
              const event = item.event;
              return (
                <SystemAlertMessage
                  key={`sandbox-${event._id}`}
                  content={sandboxEventLabel(event.event)}
                  errorDetail={event.errorDetail}
                  timestamp={event.createdAt}
                />
              );
            }
            if (item.kind === "comment") {
              const comment = item.comment;
              return (
                <CommentThread
                  key={`comment-${comment._id}`}
                  comment={comment}
                  taskId={taskId}
                  users={users}
                  repliesByParentId={repliesByParentId}
                  replyingToId={replyingToId}
                  onReplyingToChange={setReplyingToId}
                  onDeleteRequest={setDeletingCommentId}
                />
              );
            }
            const run = item.run;
            const isActiveRun =
              run.status === "running" || run.status === "queued";
            const runComment = runCommentMap.get(run._id);
            return (
              <Suspense key={run._id} fallback={<Spinner size="sm" />}>
                <RunTimelineItem
                  run={run}
                  isActiveRun={isActiveRun}
                  isFirst={index === 0}
                  streaming={streaming}
                  activeRunElapsed={activeRunElapsed}
                  isStopping={isStopping}
                  onStopConfirm={onStopConfirm}
                  runComment={runComment}
                  runCommentReplies={
                    runComment
                      ? (repliesByParentId.get(runComment._id) ?? [])
                      : []
                  }
                  users={users}
                />
              </Suspense>
            );
          })}
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
