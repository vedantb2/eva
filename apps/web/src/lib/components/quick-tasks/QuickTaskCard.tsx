"use client";

import {
  Badge,
  Card,
  CardContent,
  Checkbox,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import {
  IconClock,
  IconDots,
  IconFolder,
  IconTag,
  IconBrandVercelFilled,
} from "@tabler/icons-react";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { DEPLOYMENT_STATUS_CONFIG } from "@/lib/components/tasks/_components/task-detail-constants";
import dayjs, { compactRelativeTime } from "@conductor/shared/dates";
import { useState } from "react";
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
  taskNumber?: number;
  scheduledAt?: number;
  tags?: string[];
  createdByUser?: User;
  createdAt: number;
  projectName?: string;
  hasError?: boolean;
  deploymentStatus?: DeploymentStatus;
  groupedCodebases?: GroupedCodebase[];
  onClick?: () => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  onToggleSelect?: () => void;
  assignedTo?: Id<"users">;
  model?: string;
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
  taskNumber,
  scheduledAt,
  tags,
  createdByUser,
  createdAt,
  projectName,
  hasError = false,
  deploymentStatus,
  groupedCodebases,
  onClick,
  isSelecting,
  isSelected,
  isActive,
  onToggleSelect,
  assignedTo,
  model,
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
    assignedTo,
    model,
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

  const card = (
    <Card
      className={`group relative overflow-hidden border-0 transition-[transform,background-color] duration-150 ${
        showError
          ? "bg-destructive/5"
          : isInProgress
            ? "bg-card/95"
            : isActive
              ? "bg-primary/5"
              : "bg-card/88 hover:bg-card"
      } ${isSelected ? "ring-2 ring-primary/40" : ""} ${isActive ? "ring-1 ring-primary/30" : ""} ${
        onClick
          ? "cursor-pointer active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
          : ""
      }`}
      onClick={() => {
        if (hasDialogOpen) return;
        onClick?.();
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick || hasDialogOpen) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={`absolute inset-y-1.5 left-0 w-[3px] rounded-r-full ${accentClass}`}
      />
      <CardContent className="relative z-[1] space-y-1.5 px-2.5 py-2 pl-3 sm:px-3 sm:py-2.5 sm:pl-3.5">
        <div className="flex min-w-0 items-start gap-1.5">
          {isSelecting && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.()}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 flex-shrink-0"
            />
          )}
          <h4 className="min-w-0 flex-1 line-clamp-1 text-sm font-medium leading-5 text-foreground">
            {taskNumber !== undefined && (
              <span className="text-muted-foreground/70 font-mono text-xs mr-1.5">
                #{taskNumber}
              </span>
            )}
            {title}
          </h4>

          <div className="flex shrink-0 items-center gap-1">
            {deploymentStatus && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center">
                    <IconBrandVercelFilled
                      size={14}
                      className={
                        DEPLOYMENT_STATUS_CONFIG[deploymentStatus]?.iconColor ??
                        "text-muted-foreground"
                      }
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {DEPLOYMENT_STATUS_CONFIG[deploymentStatus]?.label ??
                    "Unknown"}
                </TooltipContent>
              </Tooltip>
            )}
            {scheduledAt ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center text-primary">
                    <IconClock size={14} />
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
          <div className="flex flex-wrap items-center gap-1">
            {projectName ? (
              <Badge
                variant="default"
                className="shrink-0 px-1.5 py-0 text-[10px] font-medium leading-4"
              >
                <div className="flex flex-row gap-0.5 items-center">
                  <IconFolder size={10} />
                  {projectName}
                </div>
              </Badge>
            ) : null}
            {tags?.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-medium leading-4"
              >
                <div className="flex flex-row gap-0.5 items-center">
                  <IconTag size={10} />
                  {tag}
                </div>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {createdByUser && <UserInitials user={createdByUser} size="sm" />}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] tabular-nums text-muted-foreground/70">
              {compactRelativeTime(createdAt)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="sm:hidden flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors relative after:absolute after:inset-[-8px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDots size={14} />
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
      </CardContent>
    </Card>
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
