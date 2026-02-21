"use client";

import {
  Button,
  Card,
  CardContent,
  Checkbox,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import {
  IconGitBranch,
  IconGitPullRequest,
  IconDotsVertical,
  IconAlertCircle,
  IconAlertTriangle,
  IconClock,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@conductor/shared";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";

interface QuickTaskCardProps {
  id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: number;
  createdBy?: Id<"users">;
  branchName?: string;
  scheduledRetryAt?: number;
  onClick?: () => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function QuickTaskCard({
  id,
  title,
  description,
  status,
  createdAt,
  createdBy,
  branchName,
  scheduledRetryAt,
  onClick,
  isSelecting,
  isSelected,
  onToggleSelect,
}: QuickTaskCardProps) {
  const { fullName } = useRepo();
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const latestRun = runs?.[0];
  const hasError = latestRun?.status === "error";
  const isRateLimited = hasError && latestRun?.errorType === "rate_limit";

  return (
    <Card
      className={`relative overflow-hidden shadow-2xs transition-all duration-200 ${
        hasError
          ? isRateLimited
            ? "border-warning/60"
            : "border-destructive/60"
          : ""
      } ${isSelected ? "ring-2 ring-primary shadow-xs" : ""} ${
        !isSelecting && onClick
          ? "cursor-pointer hover:shadow-xs hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
          : ""
      }`}
      onClick={isSelecting ? undefined : onClick}
      role={!isSelecting && onClick ? "button" : undefined}
      tabIndex={!isSelecting && onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (isSelecting || !onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${
          hasError
            ? isRateLimited
              ? "bg-warning"
              : "bg-destructive"
            : statusConfig[status].bar
        }`}
      />
      <CardContent className="p-2 pl-3 md:p-2 md:pl-3 space-y-1">
        <div className="flex min-w-0 items-center justify-between gap-2">
          {isSelecting && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.()}
              className="flex-shrink-0"
            />
          )}
          <h4 className="min-w-0 flex-1 truncate font-medium text-sm">
            {title}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SubtaskProgress taskId={id} />
            {(branchName || latestPrUrl) && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="motion-press hover:scale-105 active:scale-95"
                    >
                      <IconDotsVertical
                        size={14}
                        className="text-muted-foreground"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {branchName && (
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://github.com/${fullName}/tree/${branchName}`,
                            "_blank",
                          )
                        }
                      >
                        <IconGitBranch size={16} />
                        View Branch
                      </DropdownMenuItem>
                    )}
                    {latestPrUrl && (
                      <DropdownMenuItem
                        onClick={() => window.open(latestPrUrl, "_blank")}
                      >
                        <IconGitPullRequest size={16} />
                        View PR
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
        {/* {description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {description}
          </p>
        )} */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {createdBy && <UserInitials userId={createdBy} />}
            {hasError &&
              (isRateLimited ? (
                <span className="flex items-center gap-1 text-xs text-warning shrink-0">
                  <IconAlertTriangle size={12} />
                  Rate Limited
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-destructive shrink-0">
                  <IconAlertCircle size={12} />
                  Failed
                </span>
              ))}
            {scheduledRetryAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <IconClock size={12} />
                Retrying {dayjs(scheduledRetryAt).fromNow()}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {dayjs(createdAt).fromNow()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
