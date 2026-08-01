import { useRef } from "react";
import type { api, Doc, Id } from "@eva/backend";
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
  DropdownMenuSeparator,
} from "@eva/ui";
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
  IconServerBolt,
} from "@tabler/icons-react";
import dayjs from "@eva/shared/dates";
import { CopyLinkMenuItem } from "@/lib/components/CopyLinkButton";
import { TaskRunOptionsMenu } from "./TaskRunOptionsMenu";
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
  isRunningBackgroundCommands: boolean;
  canCreatePr: boolean;
  isCreatingPr: boolean;
  onCreatePr: () => void;
  onViewSandbox: () => void;
  onStopSandbox: () => void;
  isSandboxViewActive?: boolean;
  onRunStartupCommands: () => void;
  onRunDevServer: () => void;
  onRunBackgroundCommands: () => void;
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
  isRunningBackgroundCommands,
  canCreatePr,
  isCreatingPr,
  onCreatePr,
  onViewSandbox,
  onStopSandbox,
  isSandboxViewActive = false,
  onRunStartupCommands,
  onRunDevServer,
  onRunBackgroundCommands,
  onStartExecution,
  onResolveConfirm,
  onRequestChanges,
  variant = "footer",
}: TaskFooterProps) {
  const isHeader = variant === "header";
  const buttonSize = isHeader ? "sm" : "default";
  const iconSize = isHeader ? 16 : 18;
  const showRunButton =
    !task?.projectId &&
    (status === "todo" || (status === "in_progress" && !hasActiveRun));
  const showViewSandbox = canViewSandbox;
  const showStopSandbox = isSandboxActive && !isSandboxStopping;
  const showResolveConflicts =
    !hasActiveRun && (status === "code_review" || status === "business_review");
  const showRequestChanges =
    status !== "todo" && status !== "in_progress" && status !== undefined;
  const showRunDevServer = isSandboxActive && canStartSandbox;
  const showRunBackgroundCommands = isSandboxActive && canStartSandbox;
  const hasSandboxCommandItems =
    canStartSandbox || showRunDevServer || showRunBackgroundCommands;
  const hasPrLinkItems =
    canCreatePr ||
    Boolean(latestPrUrl) ||
    Boolean(latestDeployment?.deploymentStatus);
  const showMoreMenu =
    isHeader ||
    canStartSandbox ||
    canCreatePr ||
    showResolveConflicts ||
    showRequestChanges ||
    Boolean(latestDeployment?.deploymentStatus) ||
    Boolean(latestPrUrl);
  const hasSecondaryContent =
    isHeader || showViewSandbox || showStopSandbox || showMoreMenu;

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
        {showRunButton && (
          <TaskRunOptionsMenu taskId={taskId} size={buttonSize} />
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
                  variant="secondary"
                  size={buttonSize === "sm" ? "icon-sm" : "icon"}
                  aria-label="More"
                >
                  <IconDots size={iconSize} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showResolveConflicts && (
                  <DropdownMenuItem
                    onClick={onResolveConfirm}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconHammer className="size-3.5" />
                    )}
                    Resolve Conflicts
                  </DropdownMenuItem>
                )}
                {showResolveConflicts && hasSandboxCommandItems ? (
                  <DropdownMenuSeparator />
                ) : null}
                {canStartSandbox && (
                  <DropdownMenuItem
                    onClick={onRunStartupCommands}
                    disabled={isRetryingStartupCommands}
                  >
                    {isRetryingStartupCommands ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconRefresh className="size-3.5" />
                    )}
                    Run Startup Commands
                  </DropdownMenuItem>
                )}
                {showRunDevServer ? (
                  <DropdownMenuItem
                    onClick={onRunDevServer}
                    disabled={isRunningDevServer}
                  >
                    {isRunningDevServer ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconPlayerPlay className="size-3.5" />
                    )}
                    Run Dev Server
                  </DropdownMenuItem>
                ) : null}
                {showRunBackgroundCommands ? (
                  <DropdownMenuItem
                    onClick={onRunBackgroundCommands}
                    disabled={isRunningBackgroundCommands}
                  >
                    {isRunningBackgroundCommands ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconServerBolt className="size-3.5" />
                    )}
                    Run Background Commands
                  </DropdownMenuItem>
                ) : null}
                {(showResolveConflicts || hasSandboxCommandItems) &&
                hasPrLinkItems ? (
                  <DropdownMenuSeparator />
                ) : null}
                {canCreatePr && (
                  <DropdownMenuItem
                    onClick={onCreatePr}
                    disabled={isCreatingPr}
                  >
                    {isCreatingPr ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconGitPullRequest className="size-3.5" />
                    )}
                    Create PR
                  </DropdownMenuItem>
                )}
                {latestPrUrl ? (
                  <DropdownMenuItem asChild>
                    <a
                      href={latestPrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconGitPullRequest className="size-3.5" />
                      View PR
                    </a>
                  </DropdownMenuItem>
                ) : null}
                {latestDeployment?.deploymentStatus && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenuItem disabled>
                          <IconBrandVercel className="size-3.5" />
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
                {(showResolveConflicts ||
                  hasSandboxCommandItems ||
                  hasPrLinkItems) &&
                showRequestChanges ? (
                  <DropdownMenuSeparator />
                ) : null}
                {showRequestChanges && (
                  <DropdownMenuItem onClick={onRequestChanges}>
                    <IconMessagePlus className="size-3.5" />
                    Request Changes
                  </DropdownMenuItem>
                )}
                {isHeader ? (
                  <>
                    {(showResolveConflicts ||
                      hasSandboxCommandItems ||
                      hasPrLinkItems ||
                      showRequestChanges) && <DropdownMenuSeparator />}
                    <CopyLinkMenuItem iconSize={14} />
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {showStopSandbox ? (
            <Button
              variant="destructive"
              size={buttonSize}
              onClick={onStopSandbox}
              disabled={isSandboxStopping}
            >
              <IconPlayerStop size={iconSize} />
              <span className="hidden sm:inline">Stop Sandbox</span>
            </Button>
          ) : null}
          {showViewSandbox && (
            <Button
              variant="secondary"
              size={buttonSize}
              onClick={onViewSandbox}
              disabled={isSandboxStopping}
              className={
                isSandboxViewActive || isSandboxActive
                  ? "border-success/35 bg-success/10 text-success hover:border-success/50 hover:bg-success/15 hover:text-success"
                  : undefined
              }
            >
              {(isSandboxStarting && !isSandboxActive) || isSandboxStopping ? (
                <IconLoader2 size={iconSize} className="animate-spin" />
              ) : (
                <IconTerminal2 size={iconSize} />
              )}
              {isSandboxActive && !isSandboxViewActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
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
    <div className="group/split flex items-center transition-[transform,background-color] duration-200 active:scale-[0.96]">
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
            <IconChevronDown className="size-3.5" />
          </Button>
        }
      />
    </div>
  );
}
