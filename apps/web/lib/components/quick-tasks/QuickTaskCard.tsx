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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import {
  IconGitBranch,
  IconGitPullRequest,
  IconDotsVertical,
  IconClock,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import dayjs from "@conductor/shared/dates";

interface QuickTaskCardProps {
  id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  branchName?: string;
  scheduledAt?: number;
  tags?: string[];
  onClick?: () => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  onToggleSelect?: () => void;
}

export function QuickTaskCard({
  id,
  title,
  description,
  status,
  branchName,
  scheduledAt,
  tags,
  onClick,
  isSelecting,
  isSelected,
  isActive,
  onToggleSelect,
}: QuickTaskCardProps) {
  const { owner, name: repoName } = useRepo();
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const latestPrUrl = runs?.find((run) => run.prUrl)?.prUrl;
  const hasError = runs?.[0]?.status === "error";
  const statusMeta = statusConfig[status];
  const accentClass = hasError ? "bg-destructive" : statusMeta.bar;
  const showActions = Boolean(branchName || latestPrUrl);
  const isInProgress = status === "in_progress" && !hasError;

  const card = (
    <Card
      className={`group relative overflow-hidden shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-200 ${
        hasError
          ? "border border-destructive/60 bg-destructive/5"
          : isInProgress
            ? "border-transparent bg-card/95"
            : "border border-border/70 bg-card/88 hover:border-primary/25 hover:bg-card"
      } ${isSelected ? "ring-2 ring-primary/40 shadow-md" : ""} ${isActive ? "border-primary/50 bg-primary/5 shadow-sm" : ""} ${
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
        className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-xl transition-opacity duration-200 group-hover:opacity-30 group-focus-within:opacity-30 ${accentClass}`}
      />
      <div
        className={`absolute inset-y-1.5 left-0 w-1 rounded-r-full ${accentClass}`}
      />
      <CardContent className="relative z-[1] space-y-1 px-2 py-1.5 pl-3">
        <div className="flex min-w-0 items-start gap-1.5">
          {isSelecting && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.()}
              className="mt-0.5 flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-1 text-sm font-semibold leading-5 text-foreground">
              {title}
            </h4>
            {description ? (
              <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-muted-foreground">
                {description}
              </p>
            ) : null}
            {tags && tags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] font-medium leading-4"
                  >
                    {tag}
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
            {showActions ? (
              <div
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="motion-press rounded-full hover:scale-105 active:scale-95"
                    >
                      <IconDotsVertical
                        size={13}
                        className="text-muted-foreground"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {branchName ? (
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://github.com/${owner}/${repoName}/tree/${branchName}`,
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
      </CardContent>
    </Card>
  );

  if (isInProgress) {
    return <div className="qt-in-progress-border rounded-lg p-px">{card}</div>;
  }

  return card;
}
