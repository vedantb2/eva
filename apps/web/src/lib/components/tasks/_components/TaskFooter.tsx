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
  IconPlayerStop,
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
  canViewSandbox: boolean;
  isSandboxActive: boolean;
  isSandboxStarting: boolean;
  isSandboxStopping: boolean;
  isRetryingStartupCommands: boolean;
  isRunningDevServer: boolean;
  canCreatePr: boolean;
  isCreatingPr: boolean;
  onCreatePr: () => void;
  onViewSandbox: () => void;
  onStopSandbox: () => void;
  isSandboxViewActive?: boolean;
  onRunStartupCommands: () => void;
  onRunDevServer: () => void;
  onStartExecution: () => void;
  onResolveConfirm: () => void;
  onRequestChanges: () => void;
  variant?: "footer" | "header";
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
  canViewSandbox,
  isSandboxActive,
  isSandboxStarting,
  isSandboxStopping,
  isRetryingStartupCommands,
  isRunningDevServer,
  canCreatePr,
  isCreatingPr,
  onCreatePr,
  onViewSandbox,
  onStopSandbox,
  isSandboxViewActive = false,
  onRunStartupCommands,
  onRunDevServer,
  onStartExecution,
  onResolveConfirm,
  onRequestChanges,
  variant = "footer",
}: TaskFooterProps) {
  const isHeader = variant === "header";
  const buttonSize = isHeader ? "sm" : "default";
  const iconSize = isHeader ? 16 : 18;
  const outlineButtonClass = isHeader ? "rounded-full" : undefined;
  const showRunButton =
    !task?.projectId &&
    (status === "todo" || (status === "in_progress" && !hasActiveRun));
  const showViewSandbox = canViewSandbox;
  const showStopSandbox = isSandboxActive && !isSandboxStopping;
  const showResolveConflicts =
    !hasActiveRun && (status === "code_review" || status === "business_review");
  const showRequestChanges =
    status !== "todo" && status !== "in_progress" && status !== undefined;
  const showMoreMenu =
    canStartSandbox ||
    canCreatePr ||
    showResolveConflicts ||
    showRequestChanges ||
    Boolean(latestDeployment?.deploymentStatus);
  const hasSecondaryContent =
    showViewSandbox || showStopSandbox || showMoreMenu || Boolean(latestPrUrl);

  return (
    <div
      className={
        isHeader
          ? "flex shrink-0 items-center gap-1.5 sm:gap-2"
          : "space-y-2 w-full"
      }
    >
      {!isHeader && (executionError || latestPrError) ? (
        <p className="text-xs text-destructive text-right">
          {executionError ?? latestPrError}
        </p>
      ) : null}
      <div
        className={
          isHeader
            ? "flex shrink-0 items-center gap-1.5 sm:gap-2"
            : "flex items-center gap-3 flex-wrap justify-end"
        }
      >
        {isHeader && (executionError || latestPrError) ? (
          <p className="text-xs text-destructive max-w-[min(240px,40vw)] truncate">
            {executionError ?? latestPrError}
          </p>
        ) : null}
        {showRunButton && (
          <SplitRunButton
            taskId={taskId}
            scheduledAt={task?.scheduledAt}
            isStarting={isStarting}
            onStartExecution={onStartExecution}
            size={buttonSize}
          />
        )}
        {showRunButton && hasSecondaryContent && (
          <div className="h-6 w-px bg-muted-foreground/20" />
        )}
        <div
          className={
            isHeader
              ? "flex shrink-0 items-center gap-1.5 sm:gap-2"
              : "flex flex-wrap items-center gap-1.5 sm:gap-2"
          }
        >
          {showMoreMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size={buttonSize}
                  className={outlineButtonClass}
                >
                  <IconDots size={iconSize} />
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
                {isSandboxActive && canStartSandbox ? (
                  <DropdownMenuItem
                    onClick={onRunDevServer}
                    disabled={isRunningDevServer}
                  >
                    {isRunningDevServer ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconPlayerPlay size={14} />
                    )}
                    Run Dev Server
                  </DropdownMenuItem>
                ) : null}
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
                {showRequestChanges && (
                  <DropdownMenuItem onClick={onRequestChanges}>
                    <IconMessagePlus size={14} />
                    Request Changes
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {latestPrUrl ? (
            <Button
              asChild
              variant="outline"
              size={buttonSize}
              className={outlineButtonClass}
            >
              <a href={latestPrUrl} target="_blank" rel="noopener noreferrer">
                <IconGitPullRequest size={iconSize} />
                <span className="hidden sm:inline">View PR</span>
              </a>
            </Button>
          ) : null}
          {showStopSandbox ? (
            <Button
              variant="destructive"
              size={buttonSize}
              onClick={onStopSandbox}
              disabled={isSandboxStopping}
              className={outlineButtonClass}
            >
              <IconPlayerStop size={iconSize} />
              <span className="hidden sm:inline">Stop Sandbox</span>
            </Button>
          ) : null}
          {showViewSandbox && (
            <Button
              variant="outline"
              size={buttonSize}
              onClick={onViewSandbox}
              disabled={isSandboxStopping}
              className={
                isSandboxViewActive || isSandboxActive
                  ? `border-emerald-500/35 bg-emerald-500/10 text-emerald-700 hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-400 ${outlineButtonClass ?? ""}`
                  : outlineButtonClass
              }
            >
              {(isSandboxStarting && !isSandboxActive) || isSandboxStopping ? (
                <IconLoader2 size={iconSize} className="animate-spin" />
              ) : (
                <IconTerminal2 size={iconSize} />
              )}
              {isSandboxActive && !isSandboxViewActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <span className="hidden sm:inline">
                {isSandboxStopping
                  ? "Stopping..."
                  : isSandboxStarting && !isSandboxActive
                    ? "Starting..."
                    : isSandboxViewActive
                      ? "Back to Details"
                      : isSandboxActive
                        ? "View Sandbox · Active"
                        : "View Sandbox"}
              </span>
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
  size,
}: {
  taskId: Id<"agentTasks">;
  scheduledAt: number | undefined;
  isStarting: boolean;
  onStartExecution: () => void;
  size: "default" | "sm";
}) {
  const chevronRef = useRef<HTMLButtonElement>(null);
  const isScheduled = scheduledAt !== undefined;
  const iconSize = size === "sm" ? 16 : 18;

  return (
    <div className="group/split flex items-center transition-[transform,background-color] duration-200 hover:-translate-y-[1px] active:scale-[0.96]">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              size={size}
              onClick={
                isScheduled
                  ? () => chevronRef.current?.click()
                  : onStartExecution
              }
              disabled={isStarting}
              className={`rounded-r-none ${SPLIT_BUTTON_HALF}`}
            >
              {isStarting ? (
                <IconLoader2 size={iconSize} className="animate-spin" />
              ) : isScheduled ? (
                <IconCalendarClock size={iconSize} />
              ) : (
                <IconPlayerPlay size={iconSize} />
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
            size={size}
            className={`rounded-l-none border-l border-l-primary-foreground/20 px-2 ${SPLIT_BUTTON_HALF}`}
          >
            <IconChevronDown size={14} />
          </Button>
        }
      />
    </div>
  );
}
