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
  ActivitySteps,
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

export function RunTimelineItem({
  run,
  isActiveRun,
  isFirst,
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
  isFirst: boolean;
  streaming: Streaming | undefined;
  activeRunElapsed: number;
  isStopping: boolean;
  onStopConfirm: () => void;
  runComment: TaskComment | undefined;
  runCommentReplies: TaskComment[];
  users: Users | undefined;
}) {
  const hasRunComment = runComment !== undefined;
  const requester =
    hasRunComment && runComment.authorId
      ? users?.find((user) => user._id === runComment.authorId)
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
    <Accordion
      type="multiple"
      defaultValue={isActiveRun || isFirst ? [run._id] : []}
    >
      <AccordionItem value={run._id} className="rounded-lg bg-muted px-3">
        <div className="flex items-center gap-2">
          <AccordionTrigger className="flex-1 min-w-0">
            <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 flex-wrap">
                {hasRunComment && runComment.authorId ? (
                  <UserInitials
                    userId={runComment.authorId}
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
                  {run.mode === "resolve_conflicts"
                    ? run.status === "running"
                      ? "resolving conflicts"
                      : run.status === "success"
                        ? "resolved conflicts"
                        : run.status === "error"
                          ? "error"
                          : "queued"
                    : hasRunComment
                      ? run.status === "running"
                        ? "making changes"
                        : run.status === "success"
                          ? "made changes"
                          : run.status === "error"
                            ? "error"
                            : "queued"
                      : run.status === "running"
                        ? "running"
                        : run.status === "success"
                          ? "success"
                          : run.status === "error"
                            ? "error"
                            : "queued"}
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
            {run.status === "running" &&
              streaming?.currentActivity &&
              (() => {
                const steps = parseActivitySteps(streaming.currentActivity);
                return steps ? (
                  <ActivitySteps steps={steps} isStreaming />
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
            {run.status === "running" && streaming?.currentContent ? (
              <Streamdown className="text-sm text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {streaming.currentContent}
              </Streamdown>
            ) : null}
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
            )}
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
