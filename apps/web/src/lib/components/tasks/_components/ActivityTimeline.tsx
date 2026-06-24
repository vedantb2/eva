"use client";

import { lazy, Suspense, useState } from "react";
import { useMutation } from "convex/react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from "@conductor/ui";
import { IconLoader2 } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { AuditTimelineItem } from "./AuditTimelineItem";
import { TaskActivityItem } from "./TaskActivityItem";
import { TaskActivityComposer } from "./TaskActivityComposer";
import { TaskSubscribers } from "./TaskSubscribers";
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
  const [deletingCommentId, setDeletingCommentId] =
    useState<Id<"taskComments"> | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

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

  const userComments = comments?.filter((c) => c.authorId) ?? [];
  const topLevelComments = getTopLevelComments(userComments);
  const repliesByParentId = buildRepliesByParentId(userComments);

  // Link each run to the change-request comment that actually triggered it,
  // recorded on the run as `triggeringCommentId`. Runs without one (initial
  // task runs, Resolve Conflicts, legacy runs) intentionally have no comment.
  const commentById = new Map(topLevelComments.map((c) => [c._id, c]));
  const runCommentMap = new Map<string, (typeof topLevelComments)[number]>();
  for (const run of runs ?? []) {
    if (!run.triggeringCommentId) continue;
    const comment = commentById.get(run.triggeringCommentId);
    if (comment) runCommentMap.set(run._id, comment);
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
      <TaskSubscribers taskId={taskId} users={users} />

      <TaskActivityComposer
        taskId={taskId}
        isProjectTask={isProjectTask}
        requestingChanges={requestingChanges}
        setRequestingChanges={setRequestingChanges}
        executionError={executionError}
        setExecutionError={setExecutionError}
        requestChangesBlockedReason={requestChangesBlockedReason}
        onRequestChangesSubmitted={onRequestChangesSubmitted}
      />

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
