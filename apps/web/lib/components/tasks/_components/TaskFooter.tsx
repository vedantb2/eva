"use client";

import { api } from "@conductor/backend";
import type { Doc, Id, FunctionReturnType } from "@conductor/backend";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@conductor/ui";
import {
  IconGitPullRequest,
  IconBrandVercel,
  IconMessagePlus,
  IconHammer,
  IconPlayerPlay,
  IconLoader2,
} from "@tabler/icons-react";
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
        {!hasActiveRun && status === "todo" && (
          <>
            <SchedulePopover
              taskId={taskId}
              scheduledAt={task?.scheduledAt}
              disabled={!isOwner || isBlocked}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={onStartExecution}
                    disabled={
                      isStarting ||
                      isBlocked ||
                      !isOwner ||
                      task?.scheduledAt !== undefined
                    }
                  >
                    {isStarting ? (
                      <IconLoader2 size={18} className="animate-spin" />
                    ) : (
                      <IconPlayerPlay size={18} />
                    )}
                    Run Eva
                  </Button>
                </div>
              </TooltipTrigger>
              {task?.scheduledAt !== undefined ? (
                <TooltipContent>
                  Task is scheduled — remove the schedule to run immediately
                </TooltipContent>
              ) : (
                !isOwner && (
                  <TooltipContent>
                    Only the task owner can run Eva
                  </TooltipContent>
                )
              )}
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
