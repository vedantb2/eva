"use client";

import {
  Badge,
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

const statusChipLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  business_review: "Biz Review",
  code_review: "Code Review",
  done: "Done",
};

interface QuickTaskCardProps {
  id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: number;
  createdBy?: Id<"users">;
  branchName?: string;
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
  onClick,
  isSelecting,
  isSelected,
  onToggleSelect,
}: QuickTaskCardProps) {
  const { fullName } = useRepo();
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const latestPrUrl = runs?.find((run) => run.prUrl)?.prUrl;
  const hasError = runs?.[0]?.status === "error";
  const statusMeta = statusConfig[status];
  const StatusIcon = statusMeta.icon;
  const accentClass = hasError ? "bg-destructive" : statusMeta.bar;
  const showActions = Boolean(branchName || latestPrUrl);

  return (
    <Card
      className={`group relative overflow-hidden border border-border/70 bg-card/88 shadow-sm  transition-[transform,border-color,box-shadow,background-color] duration-200 ${
        hasError
          ? "border-destructive/60 bg-destructive/5"
          : "hover:border-primary/25 hover:bg-card"
      } ${isSelected ? "ring-2 ring-primary/40 shadow-md" : ""} ${
        !isSelecting && onClick
          ? "cursor-pointer hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
          : ""
      }`}
      onClick={isSelecting ? undefined : onClick}
      role={!isSelecting && onClick ? "button" : undefined}
      tabIndex={!isSelecting && onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (isSelecting || !onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-35 blur-2xl ${accentClass}`}
      />
      <div
        className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${accentClass}`}
      />
      <CardContent className="relative z-[1] space-y-2 p-3 pl-3.5">
        <div className="flex min-w-0 items-start gap-2">
          {isSelecting && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.()}
              className="mt-0.5 flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
              {title}
            </h4>
            {description ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <SubtaskProgress taskId={id} />
            {showActions ? (
              <div
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="motion-press rounded-full hover:scale-105 active:scale-95"
                    >
                      <IconDotsVertical
                        size={14}
                        className="text-muted-foreground"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {branchName ? (
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
                    ) : null}
                    {latestPrUrl ? (
                      <DropdownMenuItem
                        onClick={() => window.open(latestPrUrl, "_blank")}
                      >
                        <IconGitPullRequest size={16} />
                        View PR
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5"></div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <IconClock size={12} />
            {dayjs(createdAt).fromNow()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
