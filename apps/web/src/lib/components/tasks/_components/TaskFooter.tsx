"use client";

import { api } from "@conductor/backend";
import type { Doc, Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@conductor/ui";
import {
  IconGitPullRequest,
  IconBrandVercel,
  IconMessagePlus,
  IconHammer,
  IconPlayerPlay,
  IconLoader2,
  IconChevronDown,
  IconCalendarClock,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import type { TaskStatus } from "../TaskStatusBadge";
import { SchedulePopover } from "../SchedulePopover";

type RunDoc = NonNullable<
  FunctionReturnType<typeof api.agentRuns.listByTask>
>[number];

interface TaskFooterProps {
  taskId: Id<"agentTasks">;
  task: Doc<"agentTasks"> | undefined;
  status: TaskStatus | undefined;
  isOwner: boolean;
  isBlocked: boolean | undefined;
  hasActiveRun: boolean;
  latestPrUrl: string | undefined;
  latestDeployment: RunDoc | undefined;
  executionError: string | null;
  isStarting: boolean;
  onStartExecution: () => void;
  onResolveConfirm: () => void;
  onRequestChanges: () => void;
}

export function TaskFooter({
  taskId,
  task,
  status,
  isOwner,
  isBlocked,
  hasActiveRun,
  latestPrUrl,
  latestDeployment,
  executionError,
  isStarting,
  onStartExecution,
  onResolveConfirm,
  onRequestChanges,
}: TaskFooterProps) {
  return (
    <div className="space-y-2 w-full">
      {executionError && (
        <p className="text-xs text-destructive text-right">{executionError}</p>
      )}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
        {status !== "todo" && status !== "in_progress" && (
          <Button variant="secondary" onClick={onRequestChanges}>
            <IconMessagePlus size={18} />
            <span className="hidden sm:inline">Request Changes</span>
          </Button>
        )}
        {!hasActiveRun && status === "code_review" && (
          <Button
            variant="secondary"
            onClick={onResolveConfirm}
            disabled={isStarting}
          >
            {isStarting ? (
              <IconLoader2 size={18} className="animate-spin" />
            ) : (
              <IconHammer size={18} />
            )}
            <span className="hidden sm:inline">Resolve Conflicts</span>
          </Button>
        )}
        {latestPrUrl && (status === "code_review" || status === "done") && (
          <Button asChild variant="outline">
            <a href={latestPrUrl} target="_blank" rel="noopener noreferrer">
              <IconGitPullRequest size={18} />
              <span className="hidden sm:inline">View PR</span>
            </a>
          </Button>
        )}
        {latestDeployment?.deploymentStatus && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  asChild={
                    latestDeployment.deploymentStatus === "deployed" &&
                    !!latestDeployment.deploymentUrl
                  }
                  variant="outline"
                  disabled={latestDeployment.deploymentStatus !== "deployed"}
                >
                  {latestDeployment.deploymentStatus === "deployed" &&
                  latestDeployment.deploymentUrl ? (
                    <a
                      href={latestDeployment.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconBrandVercel size={18} />
                      <span className="hidden sm:inline">View Preview</span>
                    </a>
                  ) : (
                    <>
                      <IconBrandVercel size={18} />
                      <span className="hidden sm:inline">View Preview</span>
                    </>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {latestDeployment.deploymentStatus === "deployed"
                ? "Open preview deployment"
                : latestDeployment.deploymentStatus === "error"
                  ? "Deployment failed"
                  : latestDeployment.deploymentStatus === "building"
                    ? "Deployment is building..."
                    : "Deployment is queued..."}
            </TooltipContent>
          </Tooltip>
        )}
        {!hasActiveRun && status === "todo" && (
          <div className="group/split flex items-center transition-transform duration-200 hover:-translate-y-[1px]">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={
                      task?.scheduledAt !== undefined
                        ? undefined
                        : onStartExecution
                    }
                    disabled={isStarting || isBlocked || !isOwner}
                    className="rounded-r-none hover:translate-y-0 group-hover/split:bg-primary/92"
                  >
                    {isStarting ? (
                      <IconLoader2 size={18} className="animate-spin" />
                    ) : task?.scheduledAt !== undefined ? (
                      <IconCalendarClock size={18} />
                    ) : (
                      <IconPlayerPlay size={18} />
                    )}
                    {task?.scheduledAt !== undefined
                      ? dayjs(task.scheduledAt).format("MMM D, h:mm A")
                      : "Run Eva"}
                  </Button>
                </div>
              </TooltipTrigger>
              {task?.scheduledAt !== undefined ? (
                <TooltipContent>
                  Scheduled — open dropdown to change or remove
                </TooltipContent>
              ) : (
                !isOwner && (
                  <TooltipContent>
                    Only the task owner can run Eva
                  </TooltipContent>
                )
              )}
            </Tooltip>
            <SchedulePopover
              taskId={taskId}
              scheduledAt={task?.scheduledAt}
              disabled={!isOwner || isBlocked}
              trigger={
                <Button
                  disabled={!isOwner || isBlocked}
                  className="rounded-l-none border-l border-l-primary-foreground/20 px-2 hover:translate-y-0 group-hover/split:bg-primary/92"
                >
                  <IconChevronDown size={16} />
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
