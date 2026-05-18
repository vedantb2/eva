"use client";

import { useRef } from "react";
import { api } from "@conductor/backend";
import type { Doc, Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import {
  IconGitPullRequest,
  IconBrandVercel,
  IconMessagePlus,
  IconHammer,
  IconPlayerPlay,
  IconTerminal2,
  IconLoader2,
  IconChevronDown,
  IconCalendarClock,
  IconDots,
  IconRefresh,
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
  hasActiveRun: boolean;
  latestPrUrl: string | undefined;
  latestPrError: string | undefined;
  latestDeployment: RunDoc | undefined;
  executionError: string | null;
  isStarting: boolean;
  canStartSandbox: boolean;
  isSandboxActive: boolean;
  isSandboxStarting: boolean;
  isSandboxStopping: boolean;
  isRetryingStartupCommands: boolean;
  canCreatePr: boolean;
  isCreatingPr: boolean;
  onCreatePr: () => void;
  onViewSandbox: () => void;
  onRunStartupCommands: () => void;
  onStartExecution: () => void;
  onResolveConfirm: () => void;
  onRequestChanges: () => void;
}

export function TaskFooter({
  taskId,
  task,
  status,
  hasActiveRun,
  latestPrUrl,
  latestPrError,
  latestDeployment,
  executionError,
  isStarting,
  canStartSandbox,
  isSandboxActive,
  isSandboxStarting,
  isSandboxStopping,
  isRetryingStartupCommands,
  canCreatePr,
  isCreatingPr,
  onCreatePr,
  onViewSandbox,
  onRunStartupCommands,
  onStartExecution,
  onResolveConfirm,
  onRequestChanges,
}: TaskFooterProps) {
  const showRunButton =
    !task?.projectId &&
    (status === "todo" || (status === "in_progress" && !hasActiveRun));
  const showViewSandbox = canStartSandbox;
  const showResolveConflicts =
    !hasActiveRun && (status === "code_review" || status === "business_review");
  const showMoreMenu =
    canStartSandbox ||
    canCreatePr ||
    showResolveConflicts ||
    Boolean(latestDeployment?.deploymentStatus);
  const hasSecondaryContent =
    showViewSandbox ||
    showMoreMenu ||
    Boolean(latestPrUrl) ||
    (status !== "todo" && status !== "in_progress");

  return (
    <div className="space-y-2 w-full">
      {(executionError || latestPrError) && (
        <p className="text-xs text-destructive text-right">
          {executionError ?? latestPrError}
        </p>
      )}
      <div className="flex items-center gap-3 flex-wrap justify-end">
        {showRunButton && (
          <SplitRunButton
            taskId={taskId}
            scheduledAt={task?.scheduledAt}
            isStarting={isStarting}
            onStartExecution={onStartExecution}
          />
        )}
        {showRunButton && hasSecondaryContent && (
          <div className="h-6 w-px bg-muted-foreground/20" />
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {showMoreMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <IconDots size={18} />
                  <span className="hidden sm:inline">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showResolveConflicts && (
                  <DropdownMenuItem
                    onClick={onResolveConfirm}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconHammer size={14} />
                    )}
                    Resolve Conflicts
                  </DropdownMenuItem>
                )}
                {canStartSandbox && (
                  <DropdownMenuItem
                    onClick={onRunStartupCommands}
                    disabled={isRetryingStartupCommands}
                  >
                    {isRetryingStartupCommands ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconRefresh size={14} />
                    )}
                    Run Startup Commands
                  </DropdownMenuItem>
                )}
                {canCreatePr && (
                  <DropdownMenuItem
                    onClick={onCreatePr}
                    disabled={isCreatingPr}
                  >
                    {isCreatingPr ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconGitPullRequest size={14} />
                    )}
                    Create PR
                  </DropdownMenuItem>
                )}
                {latestDeployment?.deploymentStatus && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem disabled>
                          <IconBrandVercel size={14} />
                          View Preview
                        </DropdownMenuItem>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Please start sandbox and view changes through the preview
                      tab there instead
                    </TooltipContent>
                  </Tooltip>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {showViewSandbox && (
            <Button
              variant="outline"
              onClick={onViewSandbox}
              disabled={isSandboxStopping}
              className={
                isSandboxActive
                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-400"
                  : undefined
              }
            >
              {(isSandboxStarting && !isSandboxActive) || isSandboxStopping ? (
                <IconLoader2 size={18} className="animate-spin" />
              ) : (
                <IconTerminal2 size={18} />
              )}
              {isSandboxActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <span className="hidden sm:inline">
                {isSandboxStopping
                  ? "Stopping..."
                  : isSandboxStarting && !isSandboxActive
                    ? "Starting..."
                    : isSandboxActive
                      ? "View Sandbox · Active"
                      : "View Sandbox"}
              </span>
            </Button>
          )}
          {latestPrUrl && (
            <Button asChild variant="outline">
              <a href={latestPrUrl} target="_blank" rel="noopener noreferrer">
                <IconGitPullRequest size={18} />
                <span className="hidden sm:inline">View PR</span>
              </a>
            </Button>
          )}
          {status !== "todo" && status !== "in_progress" && (
            <Button variant="secondary" onClick={onRequestChanges}>
              <IconMessagePlus size={18} />
              <span className="hidden sm:inline">Request Changes</span>
            </Button>
          )}
        </div>
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
  onStartExecution,
}: {
  taskId: Id<"agentTasks">;
  scheduledAt: number | undefined;
  isStarting: boolean;
  onStartExecution: () => void;
}) {
  const chevronRef = useRef<HTMLButtonElement>(null);
  const isScheduled = scheduledAt !== undefined;

  return (
    <div className="group/split flex items-center transition-[transform,background-color] duration-200 hover:-translate-y-[1px] active:scale-[0.96]">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              onClick={
                isScheduled
                  ? () => chevronRef.current?.click()
                  : onStartExecution
              }
              disabled={isStarting}
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
                : "Run Eva on this task"}
            </Button>
          </div>
        </TooltipTrigger>
        {isScheduled && (
          <TooltipContent>Click to change or remove schedule</TooltipContent>
        )}
      </Tooltip>
      <SchedulePopover
        taskId={taskId}
        scheduledAt={scheduledAt}
        trigger={
          <Button
            ref={chevronRef}
            className={`rounded-l-none border-l border-l-primary-foreground/20 px-2 ${SPLIT_BUTTON_HALF}`}
          >
            <IconChevronDown size={16} />
          </Button>
        }
      />
    </div>
  );
}
