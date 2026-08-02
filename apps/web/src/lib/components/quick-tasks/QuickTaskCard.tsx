"use client";

import {
  Badge,
  Checkbox,
  cn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  LIST_ROW_CONTROL_CLASS,
  ListRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@eva/ui";
import type { Id, api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { UserInitials } from "@eva/shared";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "@/lib/components/sandbox/sandboxStatusStyles";
import { IconClock, IconDots, IconFolder, IconTag } from "@tabler/icons-react";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { PriorityIcon } from "@/lib/components/priority/PriorityIcon";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
import {
  PRIORITY_LABELS,
  type Priority,
} from "@/lib/components/priority/priorityMeta";
import dayjs, { compactRelativeTime } from "@eva/shared/dates";
import { useState, type MouseEvent } from "react";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";
import { DeleteTaskDialog } from "./_components/DeleteTaskDialog";
import { MoveTaskDialog } from "./_components/MoveTaskDialog";
import { TaskCardMenuItems } from "./_components/TaskCardMenuItems";

type GroupedCodebase = FunctionReturnType<
  typeof api.githubRepos.listGroupedByCodebase
>[number];
type User = FunctionReturnType<typeof api.users.listAll>[number];
type Project = FunctionReturnType<typeof api.projects.list>[number];

type DeploymentStatus = "queued" | "building" | "deployed" | "error";

interface QuickTaskCardProps {
  id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: Priority;
  taskNumber?: number;
  scheduledAt?: number;
  tags?: string[];
  createdByUser?: User;
  createdAt: number;
  projectName?: string;
  hasError?: boolean;
  deploymentStatus?: DeploymentStatus;
  sandboxStatus?: SandboxStatus;
  groupedCodebases?: GroupedCodebase[];
  /** Public (slash) path; rendered via router Link so rewrites own the href. */
  href?: string;
  /**
   * Plain-click handler. Call `event.preventDefault()` to cancel Link
   * navigation (selection mode, open dialogs).
   */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  onToggleSelect?: () => void;
  assignedTo?: Id<"users">;
  model?: string;
  providerAccountId?: Id<"userProviderAccounts">;
  projectId?: Id<"projects">;
  repoId?: Id<"githubRepos">;
  users?: User[];
  currentUserId?: Id<"users">;
  projects?: Project[];
}

export function QuickTaskCard({
  id,
  title,
  status,
  priority,
  taskNumber,
  scheduledAt,
  tags,
  createdByUser,
  createdAt,
  projectName,
  hasError = false,
  deploymentStatus: _deploymentStatus,
  sandboxStatus,
  groupedCodebases,
  href,
  onClick,
  isSelecting,
  isSelected,
  isActive,
  onToggleSelect,
  assignedTo,
  model,
  providerAccountId,
  projectId,
  repoId,
  users,
  currentUserId,
  projects,
}: QuickTaskCardProps) {
  const showError = hasError && status !== "done";
  const statusMeta = statusConfig[status];
  const accentClass = showError ? "bg-destructive" : statusMeta.bar;
  const isInProgress = status === "in_progress" && !hasError;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [moveTarget, setMoveTarget] = useState<Id<"githubRepos"> | null>(null);

  // Find the app name for the move target across all codebases
  const moveTargetAppName = (() => {
    if (!moveTarget || !groupedCodebases) return "";
    for (const codebase of groupedCodebases) {
      const app = codebase.apps.find((a) => a._id === moveTarget);
      if (app) {
        // For monorepos, show "codebase/app", for single repos just the name
        return codebase.isMonorepo
          ? `${codebase.displayName}/${app.appName}`
          : codebase.displayName;
      }
    }
    return "";
  })();

  const menuProps = {
    id,
    title,
    status,
    href,
    assignedTo,
    model,
    providerAccountId,
    createdBy: createdByUser?._id,
    projectId,
    repoId,
    groupedCodebases,
    users,
    currentUserId,
    projects,
    onDelete: () => setShowDeleteConfirm(true),
    onMove: (targetId: Id<"githubRepos">) => setMoveTarget(targetId),
  };

  const hasDialogOpen = showDeleteConfirm || moveTarget !== null;

  const hasMetadata =
    projectName !== undefined || (tags !== undefined && tags.length > 0);

  const creatorFirstName =
    createdByUser?.firstName ?? createdByUser?.fullName?.split(/\s+/)[0];

  const card = (
    <ListRow
      accentClassName={accentClass}
      selected={isActive}
      link={
        href ? (
          <DynamicLink to={toInternalRepoHref(href)} search={(prev) => prev} />
        ) : undefined
      }
      onClick={
        hasDialogOpen || onClick
          ? (event) => {
              if (hasDialogOpen) {
                event.preventDefault();
                return;
              }
              onClick?.(event);
            }
          : undefined
      }
      aria-label={title}
      contentClassName="px-2.5 py-2 pl-3 sm:px-3 sm:py-2.5 sm:pl-3.5"
      className={cn(
        showError
          ? "border-destructive/30 bg-destructive/5"
          : isInProgress
            ? "bg-card"
            : undefined,
        isSelected && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        {isSelecting && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.()}
            onClick={(e) => e.stopPropagation()}
            className={cn("mt-0.5 flex-shrink-0", LIST_ROW_CONTROL_CLASS)}
          />
        )}
        <MarqueeOnHover className="min-w-0 flex-1 text-sm font-medium leading-5 text-foreground transition-colors duration-200 group-hover:text-primary">
          {taskNumber !== undefined && (
            <span className="mr-1.5 font-mono text-xs tabular-nums text-muted-foreground/70">
              #{taskNumber}
            </span>
          )}
          {title}
        </MarqueeOnHover>

        <div className="flex shrink-0 items-center gap-1">
          {priority ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center">
                  <PriorityIcon level={priority} size={14} />
                </span>
              </TooltipTrigger>
              <TooltipContent>{PRIORITY_LABELS[priority]}</TooltipContent>
            </Tooltip>
          ) : null}
          {sandboxStatus ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    SANDBOX_STATUS_STYLES[sandboxStatus].dot,
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                {SANDBOX_STATUS_STYLES[sandboxStatus].label}
              </TooltipContent>
            </Tooltip>
          ) : null}
          {scheduledAt ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center text-primary">
                  <IconClock className="size-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {status === "todo"
                  ? `Scheduled for ${dayjs(scheduledAt).format("MMM D, h:mm A")}`
                  : `Was scheduled for ${dayjs(scheduledAt).format("MMM D, h:mm A")}`}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {hasMetadata && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {projectName ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="default"
                  className="max-w-full px-1.5 py-0 text-[10px] font-medium leading-4"
                >
                  <div className="flex min-w-0 flex-row items-center gap-0.5">
                    <IconFolder className="size-2.5 shrink-0" />
                    <span className="truncate">{projectName}</span>
                  </div>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{projectName}</TooltipContent>
            </Tooltip>
          ) : null}
          {tags?.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-medium leading-4"
            >
              <div className="flex flex-row gap-0.5 items-center">
                <IconTag className="size-2.5" />
                {tag}
              </div>
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-1.5">
          {createdByUser ? (
            <>
              <UserInitials user={createdByUser} size="sm" />
              {creatorFirstName ? (
                <MarqueeOnHover className="min-w-0 text-[10px] text-muted-foreground/70">
                  <span data-pii>{creatorFirstName}</span>
                </MarqueeOnHover>
              ) : null}
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] tabular-nums text-muted-foreground/70">
            {compactRelativeTime(createdAt)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "sm:hidden flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors relative after:absolute after:inset-[-8px]",
                  LIST_ROW_CONTROL_CLASS,
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <TaskCardMenuItems variant="dropdown" {...menuProps} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </ListRow>
  );

  const wrappedCard = isInProgress ? (
    <div className="qt-in-progress-border rounded-[9px] p-px">{card}</div>
  ) : (
    card
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{wrappedCard}</ContextMenuTrigger>
        <ContextMenuContent onClick={(e) => e.stopPropagation()}>
          <TaskCardMenuItems variant="context" {...menuProps} />
        </ContextMenuContent>
      </ContextMenu>

      <DeleteTaskDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        taskId={id}
        taskTitle={title}
      />

      <MoveTaskDialog
        targetId={moveTarget}
        targetAppName={moveTargetAppName}
        onClose={() => setMoveTarget(null)}
        taskId={id}
        taskTitle={title}
      />
    </>
  );
}
