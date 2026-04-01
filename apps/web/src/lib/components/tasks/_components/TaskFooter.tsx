"use client";

import { useRef } from "react";
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
          <SplitRunButton
            taskId={taskId}
            scheduledAt={task?.scheduledAt}
            isStarting={isStarting}
            isOwner={isOwner}
            isBlocked={isBlocked}
            onStartExecution={onStartExecution}
          />
        )}
      </div>
    </div>
  );
}

const SPLIT_BUTTON_HALF =
  "hover:translate-y-0 active:scale-100 group-hover/split:bg-primary/92";

function SplitRunButton({
  taskId,
  scheduledAt,
  isStarting,
  isOwner,
  isBlocked,
  onStartExecution,
}: {
  taskId: Id<"agentTasks">;
  scheduledAt: number | undefined;
  isStarting: boolean;
  isOwner: boolean;
  isBlocked: boolean | undefined;
  onStartExecution: () => void;
}) {
  const chevronRef = useRef<HTMLButtonElement>(null);
  const isScheduled = scheduledAt !== undefined;

  return (
    <div className="group/split flex items-center transition-[transform,background-color] duration-200 hover:-translate-y-[1px] active:scale-[0.985]">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              onClick={
                isScheduled
                  ? () => chevronRef.current?.click()
                  : onStartExecution
              }
              disabled={isStarting || isBlocked || !isOwner}
              className={`rounded-r-none ${SPLIT_BUTTON_HALF}`}
            >
              {isStarting ? (
                <IconLoader2 size={18} className="animate-spin" />
              ) : isScheduled ? (
                <IconCalendarClock size={18} />
              ) : (
                <IconPlayerPlay size={18} />
              )}
              {isScheduled
                ? dayjs(scheduledAt).format("MMM D, h:mm A")
                : "Run Eva"}
            </Button>
          </div>
        </TooltipTrigger>
        {isScheduled ? (
          <TooltipContent>Click to change or remove schedule</TooltipContent>
        ) : (
          !isOwner && (
            <TooltipContent>Only the task owner can run Eva</TooltipContent>
          )
        )}
      </Tooltip>
      <SchedulePopover
        taskId={taskId}
        scheduledAt={scheduledAt}
        disabled={!isOwner || isBlocked}
        trigger={
          <Button
            ref={chevronRef}
            disabled={!isOwner || isBlocked}
            className={`rounded-l-none border-l border-l-primary-foreground/20 px-2 ${SPLIT_BUTTON_HALF}`}
          >
            <IconChevronDown size={16} />
          </Button>
        }
      />
    </div>
  );
}
