"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Badge,
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
  ActivityTasks,
  formatElapsed,
} from "@conductor/ui";
import { IconLoader2, IconPlayerStop } from "@tabler/icons-react";
import dayjs, { formatExactDateTime } from "@conductor/shared/dates";
import { UserInitials } from "@conductor/shared";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import { useRepo } from "@/lib/contexts/RepoContext";
import { getUserDisplayName } from "./task-detail-constants";
import type { TaskComment } from "../_utils/commentThread";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";
import { formatDuration } from "@conductor/shared/duration";
import { RunActivityLog } from "../RunActivityLog";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";

const summaryPlugins = { cjk, math, mermaid };

/** Matches scroll cap used for run logs inside the same accordion. */
const RUN_ACCORDION_SCROLL_CLASS =
  "max-h-60 overflow-y-auto overflow-x-hidden scrollbar";

type Run = NonNullable<
  FunctionReturnType<typeof api.agentRuns.listByTask>
>[number];
type Streaming = FunctionReturnType<typeof api.streaming.get>;
type Users = FunctionReturnType<typeof api.users.listAll>;

/** Human-readable badge label for a run. The error/queued/cancelled labels are
 * the same everywhere; only running/success vary by run mode and whether the
 * run was triggered by a change-request comment. */
function getRunStatusLabel(run: Run, hasRunComment: boolean): string {
  switch (run.status) {
    case "cancelled":
      return "cancelled";
    case "error":
      return "error";
    case "queued":
      return "queued";
    case "running":
      if (run.mode === "resolve_conflicts") return "resolving conflicts";
      if (hasRunComment) return "making changes";
      return "running";
    case "success":
      if (run.mode === "resolve_conflicts") return "resolved conflicts";
      if (hasRunComment) return "made changes";
      return "success";
  }
}

export function RunTimelineItem({
  run,
  isActiveRun,
  streaming,
  activeRunElapsed,
  isStopping,
  onStopConfirm,
  runComment,
  runCommentReplies,
  users,
}: {
  run: Run;
  isActiveRun: boolean;
  streaming: Streaming | undefined;
  activeRunElapsed: number;
  isStopping: boolean;
  onStopConfirm: () => void;
  runComment: TaskComment | undefined;
  runCommentReplies: TaskComment[];
  users: Users | undefined;
}) {
  const hasRunComment = runComment !== undefined;
  // The run's initiator: the change-request comment's author when the run was
  // started via "Make changes", otherwise whoever clicked the button. Legacy
  // runs predating `triggeredBy` show no initiator.
  const requesterUserId = runComment?.authorId ?? run.triggeredBy;
  const requester = requesterUserId
    ? users?.find((user) => user._id === requesterUserId)
    : undefined;

  const runDuration =
    isActiveRun && run.startedAt ? (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatElapsed(activeRunElapsed)}
      </span>
    ) : run.startedAt && run.finishedAt ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(run.startedAt, run.finishedAt)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Completed {formatExactDateTime(run.finishedAt)}
        </TooltipContent>
      </Tooltip>
    ) : null;

  return (
    <Accordion type="multiple" defaultValue={[]}>
      <AccordionItem
        value={run._id}
        className="rounded-surface bg-muted/40 px-3"
      >
        <div className="flex items-center gap-2">
          <AccordionTrigger className="flex-1 min-w-0">
            <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 flex-wrap">
                {requesterUserId ? (
                  <UserInitials
                    userId={requesterUserId}
                    size="sm"
                    hideLastSeen
                  />
                ) : null}
                {requester ? (
                  <span className="truncate text-xs font-medium text-foreground">
                    {getUserDisplayName(requester)}
                  </span>
                ) : null}
                <Badge
                  variant={
                    run.status === "running"
                      ? "warning"
                      : run.status === "error"
                        ? "destructive"
                        : run.status === "success"
                          ? "success"
                          : "secondary"
                  }
                >
                  {getRunStatusLabel(run, hasRunComment)}
                </Badge>
                {runDuration}
              </div>
              <RelativeDateTime
                at={run.startedAt}
                className="shrink-0 text-xs"
              />
            </div>
          </AccordionTrigger>
          {isActiveRun && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStopConfirm();
                    }}
                    disabled={isStopping}
                  >
                    {isStopping ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconPlayerStop size={14} />
                    )}
                    Stop
                  </Button>
                </div>
              </TooltipTrigger>
            </Tooltip>
          )}
        </div>
        <AccordionContent>
          <div className="space-y-2">
            {runComment ? (
              <div
                className={`ml-2 space-y-2 border-l-2 border-muted-foreground/25 pl-3 ${RUN_ACCORDION_SCROLL_CLASS}`}
              >
                <RunInlineComment comment={runComment} users={users} />
                {runCommentReplies.map((reply) => (
                  <div key={reply._id} className="ml-2 pl-2">
                    <RunInlineComment comment={reply} users={users} />
                  </div>
                ))}
              </div>
            ) : null}
            {run.status === "running" &&
              streaming?.currentActivity &&
              (() => {
                const steps = parseActivitySteps(streaming.currentActivity);
                return steps ? (
                  <ActivityTasks steps={steps} isStreaming />
                ) : (
                  <Reasoning isStreaming defaultOpen>
                    <ReasoningTrigger
                      getThinkingMessage={(s) =>
                        s ? "Working..." : "Processing complete"
                      }
                    />
                    <ReasoningContent>
                      {streaming.currentActivity}
                    </ReasoningContent>
                  </Reasoning>
                );
              })()}
            <RunActivityLog runId={run._id} isActive={isActiveRun} />
            {run.resultSummary && (
              <Streamdown
                className="text-sm text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                plugins={summaryPlugins}
              >
                {run.resultSummary}
              </Streamdown>
            )}
            {run.error && (
              <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
                {run.error}
              </div>
            )}
            {run.logs.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Logs</p>
                <div
                  className={`bg-muted rounded p-2 font-mono text-xs space-y-1 ${RUN_ACCORDION_SCROLL_CLASS}`}
                >
                  {run.logs.map((log, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${
                        log.level === "error"
                          ? "text-destructive"
                          : log.level === "warn"
                            ? "text-warning"
                            : "text-muted-foreground"
                      }`}
                    >
                      <span className="text-muted-foreground flex-shrink-0">
                        {dayjs(log.timestamp).format("DD/MM/YYYY HH:mm")}
                      </span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}{" "}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function RunInlineComment({
  comment,
  users,
}: {
  comment: TaskComment;
  users: Users | undefined;
}) {
  const { basePath } = useRepo();
  const author = comment.authorId
    ? users?.find((user) => user._id === comment.authorId)
    : undefined;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {comment.authorId ? (
            <UserInitials userId={comment.authorId} size="sm" />
          ) : null}
          {author ? (
            <span className="truncate text-xs font-medium text-foreground">
              {getUserDisplayName(author)}
            </span>
          ) : null}
        </div>
        <RelativeDateTime at={comment.createdAt} className="shrink-0 text-xs" />
      </div>
      <div className="text-sm text-muted-foreground">
        <MessageMentionText text={comment.content} repoBasePath={basePath} />
      </div>
    </div>
  );
}
