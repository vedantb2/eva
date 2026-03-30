"use client";

import {
  Badge,
  Card,
  CardContent,
  Checkbox,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { UserInitials } from "@conductor/shared";
import {
  IconArrowMoveRight,
  IconBrain,
  IconClipboard,
  IconClock,
  IconDots,
  IconFolder,
  IconLink,
  IconTag,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";
import { useQuery } from "convex-helpers/react/cache";
import { useMutation } from "convex/react";
import {
  statusConfig,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import dayjs, { compactRelativeTime } from "@conductor/shared/dates";
import { useState } from "react";
import { DeleteTaskDialog } from "./_components/DeleteTaskDialog";
import { MoveTaskDialog } from "./_components/MoveTaskDialog";

type SiblingApp = { _id: Id<"githubRepos">; appName: string };

interface QuickTaskCardProps {
  id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  taskNumber?: number;
  scheduledAt?: number;
  tags?: string[];
  createdBy?: Id<"users">;
  createdAt: number;
  projectName?: string;
  siblingApps?: SiblingApp[];
  onClick?: () => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  onToggleSelect?: () => void;
  assignedTo?: Id<"users">;
  model?: string;
  projectId?: Id<"projects">;
  repoId?: Id<"githubRepos">;
}

const MODEL_OPTIONS = [
  { value: "opus", label: "Opus" },
  { value: "sonnet", label: "Sonnet" },
  { value: "haiku", label: "Haiku" },
] as const;

export function QuickTaskCard({
  id,
  title,
  description,
  status,
  taskNumber,
  scheduledAt,
  tags,
  createdBy,
  createdAt,
  projectName,
  siblingApps,
  onClick,
  isSelecting,
  isSelected,
  isActive,
  onToggleSelect,
  assignedTo,
  model,
  projectId,
  repoId,
}: QuickTaskCardProps) {
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const hasError = runs?.[0]?.status === "error";
  const showError = hasError && status !== "done";
  const statusMeta = statusConfig[status];
  const accentClass = showError ? "bg-destructive" : statusMeta.bar;
  const isInProgress = status === "in_progress" && !hasError;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [moveTarget, setMoveTarget] = useState<Id<"githubRepos"> | null>(null);

  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const updateTask = useMutation(api.agentTasks.update);
  const users = useQuery(api.users.listAll);
  const projects = useQuery(api.projects.list, repoId ? { repoId } : "skip");
  const currentUserId = useQuery(api.auth.me);

  const moveTargetAppName =
    siblingApps?.find((a) => a._id === moveTarget)?.appName ?? "";

  const StatusIcon = statusConfig[status].icon;

  const contextMenuItems = (
    <>
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <StatusIcon size={16} />
          Status
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuRadioGroup
            value={status}
            onValueChange={(value) => {
              const matched = TASK_STATUSES.find((s) => s === value);
              if (!matched) return;
              updateStatus({ id, status: matched });
            }}
          >
            {TASK_STATUSES.map((s) => {
              const cfg = statusConfig[s];
              const Icon = cfg.icon;
              return (
                <ContextMenuRadioItem key={s} value={s}>
                  <Icon size={16} className={cfg.text} />
                  {cfg.label}
                </ContextMenuRadioItem>
              );
            })}
          </ContextMenuRadioGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <IconUserPlus size={16} />
          Assignee
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuRadioGroup
            value={assignedTo ?? "unassigned"}
            onValueChange={(value) => {
              if (value === "unassigned") {
                updateTask({ id, assignedTo: null });
              } else {
                const matchedUser = (users ?? []).find((u) => u._id === value);
                const userId =
                  currentUserId === value ? currentUserId : matchedUser?._id;
                if (!userId) return;
                updateTask({ id, assignedTo: userId });
              }
            }}
          >
            {currentUserId && (
              <ContextMenuRadioItem value={currentUserId}>
                Assign to me
              </ContextMenuRadioItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuRadioItem value="unassigned">
              Unassigned
            </ContextMenuRadioItem>
            {users?.map((user) => (
              <ContextMenuRadioItem key={user._id} value={user._id}>
                {user.fullName ?? user.firstName ?? "Unknown"}
              </ContextMenuRadioItem>
            ))}
          </ContextMenuRadioGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={status !== "todo"}>
          <IconBrain size={16} />
          Model
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuRadioGroup
            value={model ?? "sonnet"}
            onValueChange={(value) => {
              const matched = MODEL_OPTIONS.find((m) => m.value === value);
              if (!matched) return;
              updateTask({ id, model: matched.value });
            }}
          >
            {MODEL_OPTIONS.map((m) => (
              <ContextMenuRadioItem key={m.value} value={m.value}>
                {m.label}
              </ContextMenuRadioItem>
            ))}
          </ContextMenuRadioGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <IconFolder size={16} />
          Project
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuRadioGroup
            value={projectId ?? "none"}
            onValueChange={(value) => {
              if (value === "none") {
                updateTask({ id, projectId: null });
              } else {
                const matched = (projects ?? []).find((p) => p._id === value);
                if (!matched) return;
                updateTask({ id, projectId: matched._id });
              }
            }}
          >
            <ContextMenuRadioItem value="none">No project</ContextMenuRadioItem>
            {projects?.map((project) => (
              <ContextMenuRadioItem key={project._id} value={project._id}>
                {project.title}
              </ContextMenuRadioItem>
            ))}
          </ContextMenuRadioGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      {siblingApps && siblingApps.length > 0 && (
        <>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <IconArrowMoveRight size={16} />
              Move to app
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {siblingApps.map((app) => (
                <ContextMenuItem
                  key={app._id}
                  onSelect={(e) => {
                    e.preventDefault();
                    setMoveTarget(app._id);
                  }}
                >
                  {app.appName}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
        </>
      )}

      <ContextMenuItem
        onSelect={() => {
          navigator.clipboard.writeText(title);
        }}
      >
        <IconClipboard size={16} />
        Copy title
      </ContextMenuItem>
      <ContextMenuItem
        onSelect={() => {
          navigator.clipboard.writeText(
            window.location.origin + window.location.pathname,
          );
        }}
      >
        <IconLink size={16} />
        Copy task link
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        className="text-destructive focus:text-destructive"
        onSelect={(e) => {
          e.preventDefault();
          setShowDeleteConfirm(true);
        }}
      >
        <IconTrash size={16} />
        Delete
      </ContextMenuItem>
    </>
  );

  const dropdownMenuItems = (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <StatusIcon size={16} />
          Status
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(value) => {
              const matched = TASK_STATUSES.find((s) => s === value);
              if (!matched) return;
              updateStatus({ id, status: matched });
            }}
          >
            {TASK_STATUSES.map((s) => {
              const cfg = statusConfig[s];
              const Icon = cfg.icon;
              return (
                <DropdownMenuRadioItem key={s} value={s}>
                  <Icon size={16} className={cfg.text} />
                  {cfg.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <IconUserPlus size={16} />
          Assignee
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={assignedTo ?? "unassigned"}
            onValueChange={(value) => {
              if (value === "unassigned") {
                updateTask({ id, assignedTo: null });
              } else {
                const matchedUser = (users ?? []).find((u) => u._id === value);
                const userId =
                  currentUserId === value ? currentUserId : matchedUser?._id;
                if (!userId) return;
                updateTask({ id, assignedTo: userId });
              }
            }}
          >
            {currentUserId && (
              <DropdownMenuRadioItem value={currentUserId}>
                Assign to me
              </DropdownMenuRadioItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuRadioItem value="unassigned">
              Unassigned
            </DropdownMenuRadioItem>
            {users?.map((user) => (
              <DropdownMenuRadioItem key={user._id} value={user._id}>
                {user.fullName ?? user.firstName ?? "Unknown"}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={status !== "todo"}>
          <IconBrain size={16} />
          Model
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={model ?? "sonnet"}
            onValueChange={(value) => {
              const matched = MODEL_OPTIONS.find((m) => m.value === value);
              if (!matched) return;
              updateTask({ id, model: matched.value });
            }}
          >
            {MODEL_OPTIONS.map((m) => (
              <DropdownMenuRadioItem key={m.value} value={m.value}>
                {m.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <IconFolder size={16} />
          Project
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={projectId ?? "none"}
            onValueChange={(value) => {
              if (value === "none") {
                updateTask({ id, projectId: null });
              } else {
                const matched = (projects ?? []).find((p) => p._id === value);
                if (!matched) return;
                updateTask({ id, projectId: matched._id });
              }
            }}
          >
            <DropdownMenuRadioItem value="none">
              No project
            </DropdownMenuRadioItem>
            {projects?.map((project) => (
              <DropdownMenuRadioItem key={project._id} value={project._id}>
                {project.title}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      {siblingApps && siblingApps.length > 0 && (
        <>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <IconArrowMoveRight size={16} />
              Move to app
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {siblingApps.map((app) => (
                <DropdownMenuItem
                  key={app._id}
                  onSelect={(e) => {
                    e.preventDefault();
                    setMoveTarget(app._id);
                  }}
                >
                  {app.appName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
        </>
      )}

      <DropdownMenuItem
        onSelect={() => {
          navigator.clipboard.writeText(title);
        }}
      >
        <IconClipboard size={16} />
        Copy title
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          navigator.clipboard.writeText(
            window.location.origin + window.location.pathname,
          );
        }}
      >
        <IconLink size={16} />
        Copy task link
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onSelect={(e) => {
          e.preventDefault();
          setShowDeleteConfirm(true);
        }}
      >
        <IconTrash size={16} />
        Delete
      </DropdownMenuItem>
    </>
  );

  const card = (
    <Card
      className={`group relative overflow-hidden border-0 transition-[transform,background-color] duration-200 ${
        showError
          ? "bg-card/88"
          : isInProgress
            ? "bg-card/95"
            : isActive
              ? "bg-primary/5"
              : "bg-card/88 hover:bg-card"
      } ${isSelected ? "ring-2 ring-primary/40" : ""} ${isActive ? "ring-1 ring-primary/30" : ""} ${
        onClick
          ? "cursor-pointer hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
          : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-xl transition-opacity duration-200 group-hover:opacity-30 group-focus-within:opacity-30 ${accentClass}`}
      />
      <div
        className={`absolute inset-y-1.5 left-0 w-1 rounded-r-full ${accentClass}`}
      />
      <CardContent className="relative z-[1] space-y-1 px-2.5 py-1.5 pl-3 sm:px-3 sm:py-2 sm:pl-3.5">
        <div className="flex min-w-0 items-start gap-1.5">
          {isSelecting && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.()}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-1 text-sm font-semibold leading-5 text-foreground">
              {taskNumber !== undefined && (
                <span className="text-muted-foreground font-mono mr-1.5">
                  #{taskNumber}
                </span>
              )}
              {title}
            </h4>

            {projectName ? (
              <Badge
                variant="default"
                className="ml-auto shrink-0 px-1.5 py-0 text-[10px] font-medium leading-4"
              >
                <div className="flex flex-row gap-0.5 items-center">
                  <IconFolder size={10} />
                  {projectName}
                </div>
              </Badge>
            ) : null}
            {tags && tags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {tags.map((tag) => (
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
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
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
            <SubtaskProgress taskId={id} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            {createdBy && <UserInitials userId={createdBy} size="sm" />}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              {compactRelativeTime(createdAt)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="sm:hidden flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDots size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dropdownMenuItems}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const wrappedCard = isInProgress ? (
    <div className="qt-in-progress-border rounded-lg p-px">{card}</div>
  ) : (
    card
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{wrappedCard}</ContextMenuTrigger>
        <ContextMenuContent>{contextMenuItems}</ContextMenuContent>
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
