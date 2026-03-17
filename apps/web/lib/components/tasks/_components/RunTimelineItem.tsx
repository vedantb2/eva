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
import {
  IconMessagePlus,
  IconLoader2,
  IconPlayerStop,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { formatDuration } from "@/lib/utils/formatDuration";
import { RunActivityLog } from "../RunActivityLog";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Run = NonNullable<
  FunctionReturnType<typeof api.agentRuns.listByTask>
>[number];
type Streaming = FunctionReturnType<typeof api.streaming.get>;

export function RunTimelineItem({
  run,
  isActiveRun,
  streaming,
  activeRunElapsed,
  isOwner,
  isStopping,
  onStopConfirm,
  hasComment,
  onViewComment,
}: {
  run: Run;
  isActiveRun: boolean;
  streaming: Streaming | undefined;
  activeRunElapsed: number;
  isOwner: boolean;
  isStopping: boolean;
  onStopConfirm: () => void;
  hasComment: boolean;
  onViewComment: () => void;
}) {
  return (
    <Accordion type="multiple" defaultValue={isActiveRun ? [run._id] : []}>
      <AccordionItem value={run._id} className="rounded-lg bg-muted/40 px-3">
        <div className="flex items-center gap-2">
          <AccordionTrigger className="flex-1 min-w-0">
            <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
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
                    : hasComment
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
                {hasComment && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        role="button"
                        tabIndex={0}
                        className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewComment();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            onViewComment();
                          }
                        }}
                      >
                        <IconMessagePlus size={14} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>View user message</TooltipContent>
                  </Tooltip>
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {run.startedAt
                    ? dayjs(run.startedAt).format("DD/MM/YYYY HH:mm")
                    : "Queued"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isActiveRun && run.startedAt ? (
                  <span className="text-xs text-muted-foreground">
                    {formatElapsed(activeRunElapsed)}
                  </span>
                ) : run.startedAt && run.finishedAt ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(run.startedAt, run.finishedAt)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Completed{" "}
                      {dayjs(run.finishedAt).format("DD/MM/YYYY HH:mm")}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
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
                    disabled={isStopping || !isOwner}
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
              {!isOwner && (
                <TooltipContent>
                  Only the task owner can stop execution
                </TooltipContent>
              )}
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
            <RunActivityLog runId={run._id} />
            {run.resultSummary && (
              <p className="text-sm text-muted-foreground">
                {run.resultSummary}
              </p>
            )}
            {run.error && (
              <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
                {run.error}
              </div>
            )}
            {run.logs.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Logs</p>
                <div className="bg-muted rounded p-2 max-h-60 overflow-y-auto scrollbar font-mono text-xs space-y-1">
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
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
