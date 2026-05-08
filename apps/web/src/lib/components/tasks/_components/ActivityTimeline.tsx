"use client";

import { lazy, Suspense, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Spinner,
} from "@conductor/ui";
import dayjs from "@conductor/shared/dates";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { AuditTimelineItem } from "./AuditTimelineItem";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";

const RunTimelineItem = lazy(() =>
  import("./RunTimelineItem").then((m) => ({ default: m.RunTimelineItem })),
);

type Runs = FunctionReturnType<typeof api.agentRuns.listByTask>;
type Audits = FunctionReturnType<typeof api.audits.listByTask>;
type Comments = FunctionReturnType<typeof api.taskComments.listByTask>;
type Streaming = FunctionReturnType<typeof api.streaming.get>;
type SandboxEvents = FunctionReturnType<
  typeof api.taskSandboxEvents.listByTask
>;
type SandboxEvent = NonNullable<SandboxEvents>[number];

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
  runs,
  allAudits,
  comments,
  sandboxEvents,
  streaming,
  auditStreaming,
  activeRunElapsed,
  auditElapsed,
  fixElapsed,
  isStopping,
  onStopConfirm,
}: {
  runs: Runs | undefined;
  allAudits: Audits | undefined;
  comments: Comments | undefined;
  sandboxEvents: SandboxEvents | undefined;
  streaming: Streaming | undefined;
  auditStreaming: Streaming | undefined;
  activeRunElapsed: number;
  auditElapsed: number;
  fixElapsed: number;
  isStopping: boolean;
  onStopConfirm: () => void;
}) {
  const [viewingCommentForRun, setViewingCommentForRun] = useState<
    string | null
  >(null);

  const sortedRuns = [...(runs ?? [])].sort(
    (a, b) =>
      (a.startedAt ?? a._creationTime) - (b.startedAt ?? b._creationTime),
  );
  const firstRunId = sortedRuns.length > 0 ? sortedRuns[0]._id : null;

  const filteredComments = comments?.filter((c) => c.authorId);

  const runCommentMap = new Map<
    string,
    NonNullable<typeof filteredComments>[number]
  >();
  if (filteredComments && runs) {
    const sortedComments = [...filteredComments].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    for (const run of sortedRuns) {
      if (run._id === firstRunId) continue;
      const runTime = run._creationTime;
      let matchedComment:
        | NonNullable<typeof filteredComments>[number]
        | undefined;
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

  const viewingComment = viewingCommentForRun
    ? runCommentMap.get(viewingCommentForRun)
    : undefined;

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
  ].sort((a, b) => b.timestamp - a.timestamp);

  if (activityTimeline.length === 0) return null;

  return (
    <div className="pt-4">
      <div className="space-y-2">
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
          const run = item.run;
          const isActiveRun =
            run.status === "running" || run.status === "queued";
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
                hasComment={runCommentMap.has(run._id)}
                onViewComment={() => setViewingCommentForRun(run._id)}
              />
            </Suspense>
          );
        })}
      </div>
      <Dialog
        open={viewingCommentForRun !== null}
        onOpenChange={(v) => {
          if (!v) setViewingCommentForRun(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Message</DialogTitle>
          </DialogHeader>
          {viewingComment && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">
                {dayjs(viewingComment.createdAt).fromNow()}
              </span>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {viewingComment.content}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
