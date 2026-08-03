"use client";

import type { api } from "@eva/backend";
import type { Doc, Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@eva/ui";
import {
  IconBrandVercelFilled,
  IconGitBranch,
  IconInfoCircle,
  IconUserPlus,
} from "@tabler/icons-react";
import { UserInitials, getUserInitials } from "@eva/shared";
import { Facehash } from "facehash";
import {
  statusConfig,
  TASK_STATUSES,
  type DisplayTaskStatus,
  type TaskStatus,
} from "../TaskStatusBadge";
import { PriorityIcon } from "@/lib/components/priority/PriorityIcon";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  type Priority,
} from "@/lib/components/priority/priorityMeta";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { PropertyRow } from "./PropertyRow";
import {
  DEPLOYMENT_STATUS_CONFIG,
  GHOST_TRIGGER_CLASS,
  getUserDisplayName,
  NO_PRIORITY_VALUE,
  UNASSIGNED_VALUE,
} from "./task-detail-constants";

type RunDoc = NonNullable<
  FunctionReturnType<typeof api.agentRuns.listByTask>
>[number];

interface TaskPropertySelectsProps {
  task: Doc<"agentTasks"> | undefined;
  status: TaskStatus | undefined;
  isBlocked: boolean | undefined;
  users: FunctionReturnType<typeof api.users.listAll> | undefined;
  baseBranch: string;
  latestDeployment: RunDoc | undefined;
  onStatusChange: (status: DisplayTaskStatus) => void;
  onPriorityChange: (priority: Priority | null) => void;
  onAssigneeChange: (userId: Id<"users"> | null) => void;
  onBaseBranchChange: (branch: string) => void;
}

/**
 * Status, priority, code reviewer, base branch and deployment rows of the task
 * properties rail. Split out of `StatusFieldsSection` so that file keeps only
 * the mutations and the rail composition.
 */
export function TaskPropertySelects({
  task,
  status,
  isBlocked,
  users,
  baseBranch,
  latestDeployment,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onBaseBranchChange,
}: TaskPropertySelectsProps) {
  const assignedUser = task?.assignedTo
    ? users?.find((u) => u._id === task.assignedTo)
    : undefined;
  const assignedDisplayName = assignedUser
    ? getUserDisplayName(assignedUser)
    : "Unnamed User";
  const reviewers = (users ?? []).filter((u) => u.role === "dev");
  const deploymentStatus = latestDeployment?.deploymentStatus;

  return (
    <>
      <PropertyRow label="Status">
        <Select
          value={status ?? ""}
          onValueChange={(val) => {
            const matched = TASK_STATUSES.find((s) => s === val);
            if (matched) {
              onStatusChange(matched);
            }
          }}
        >
          <SelectTrigger className={GHOST_TRIGGER_CLASS}>
            <SelectValue placeholder="Status">
              {status ? (
                <StatusValue status={status} isBlocked={isBlocked} />
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              {TASK_STATUSES.map((s) => {
                const config = statusConfig[s];
                const Icon = config.icon;
                return (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} className={config.text} />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow label="Priority">
        <Select
          value={task?.priority ?? NO_PRIORITY_VALUE}
          onValueChange={(val) => {
            if (val === NO_PRIORITY_VALUE) {
              onPriorityChange(null);
              return;
            }
            const matched = PRIORITY_ORDER.find((p) => p === val);
            if (matched) {
              onPriorityChange(matched);
            }
          }}
        >
          <SelectTrigger className={GHOST_TRIGGER_CLASS}>
            <SelectValue>
              <div
                className={`flex items-center gap-1.5 ${task?.priority ? "" : "text-muted-foreground"}`}
              >
                <PriorityIcon level={task?.priority} size={14} />
                <span>
                  {task?.priority ? PRIORITY_LABELS[task.priority] : "None"}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Priority</SelectLabel>
              <SelectItem value={NO_PRIORITY_VALUE}>
                <div className="flex items-center gap-1.5">
                  <PriorityIcon level={undefined} size={14} />
                  <span>No priority</span>
                </div>
              </SelectItem>
              {PRIORITY_ORDER.map((p: Priority) => (
                <SelectItem key={p} value={p}>
                  <div className="flex items-center gap-1.5">
                    <PriorityIcon level={p} size={14} />
                    <span>{PRIORITY_LABELS[p]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow label="Code reviewer">
        <Select
          value={task?.assignedTo ?? UNASSIGNED_VALUE}
          onValueChange={(val) => {
            if (val === UNASSIGNED_VALUE) {
              onAssigneeChange(null);
              return;
            }
            const user = users?.find((u) => u._id === val);
            if (user) onAssigneeChange(user._id);
          }}
        >
          <SelectTrigger className={GHOST_TRIGGER_CLASS}>
            <SelectValue>
              <div
                className={`flex items-center gap-1.5 ${task?.assignedTo ? "" : "text-muted-foreground"}`}
              >
                {assignedUser ? (
                  <UserInitials user={assignedUser} size="sm" hideLastSeen />
                ) : (
                  <IconUserPlus size={14} className="text-muted-foreground" />
                )}
                <span
                  className="truncate"
                  data-pii={Boolean(task?.assignedTo) || undefined}
                >
                  {task?.assignedTo ? assignedDisplayName : "Unassigned"}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Code Reviewer</SelectLabel>
              <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
              {reviewers.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  <div className="flex items-center gap-1.5">
                    <Facehash
                      size={16}
                      name={getUserInitials(user)}
                      enableBlink
                    />
                    <span data-pii>{getUserDisplayName(user)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </PropertyRow>

      {/* Model lives in the Make-changes composer (quick + project). */}

      {task?.projectId ? null : (
        <PropertyRow label="Branch">
          {status === "todo" ? (
            <BranchSelect
              value={baseBranch}
              onValueChange={onBaseBranchChange}
              className="h-8 border-0 bg-transparent px-1.5 text-2sm shadow-none hover:bg-muted/60 [&>svg:last-child]:hidden"
            />
          ) : (
            <div className="flex h-8 items-center gap-1.5 px-1.5 text-2sm">
              <IconGitBranch size={14} className="text-muted-foreground" />
              <span className="truncate">{baseBranch}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle
                    size={12}
                    className="shrink-0 cursor-help text-muted-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Cannot be modified after task has run
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </PropertyRow>
      )}

      {deploymentStatus ? (
        <PropertyRow label="Deployment">
          <div className="flex h-8 items-center gap-1.5 px-1.5 text-2sm">
            <IconBrandVercelFilled
              size={14}
              className={
                DEPLOYMENT_STATUS_CONFIG[deploymentStatus]?.iconColor ??
                "text-muted-foreground"
              }
            />
            <span className="truncate">
              {DEPLOYMENT_STATUS_CONFIG[deploymentStatus]?.label ?? "Unknown"}
            </span>
          </div>
        </PropertyRow>
      ) : null}
    </>
  );
}

/** Selected-status face of the status trigger: tinted glyph, neutral label. */
function StatusValue({
  status,
  isBlocked,
}: {
  status: TaskStatus;
  isBlocked: boolean | undefined;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className={config.text} />
      <span className="truncate">{config.label}</span>
      {isBlocked ? (
        <Badge variant="warning" className="ml-0.5">
          Blocked
        </Badge>
      ) : null}
    </div>
  );
}
