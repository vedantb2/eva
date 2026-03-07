"use client";

import {
  Badge,
  Card,
  CardContent,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { UserInitials } from "@conductor/shared";
import { IconClock, IconFolder, IconTag } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
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
  scheduledAt?: number;
  tags?: string[];
  createdBy?: Id<"users">;
  createdAt: number;
  projectName?: string;
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
  scheduledAt,
  tags,
  createdBy,
  createdAt,
  projectName,
  onClick,
  isSelecting,
  isSelected,
  isActive,
  onToggleSelect,
}: QuickTaskCardProps) {
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const hasError = runs?.[0]?.status === "error";
  const showError = hasError && status !== "done";
  const statusMeta = statusConfig[status];
  const accentClass = showError ? "bg-destructive" : statusMeta.bar;
  const isInProgress = status === "in_progress" && !hasError;

  const card = (
    <Card
      className={`group relative overflow-hidden shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-200 ${
        showError
          ? "border border-border/70 bg-card/88"
          : isInProgress
            ? "border-transparent bg-card/95"
            : isActive
              ? "border border-primary/40 bg-primary/5"
              : "border border-border/70 bg-card/88 hover:border-primary/25 hover:bg-card"
      } ${isSelected ? "ring-2 ring-primary/40 shadow-md" : ""} ${isActive ? "ring-1 ring-primary/30" : ""} ${
        onClick
          ? "cursor-pointer hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
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
      <CardContent className="relative z-[1] space-y-1 px-2.5 py-2 pl-3 sm:px-3 sm:py-2.5 sm:pl-3.5">
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
              {title}
            </h4>
            {description ? (
              <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-muted-foreground">
                {description}
              </p>
            ) : null}
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
          <div className="flex items-center">
            {createdBy && <UserInitials userId={createdBy} size="sm" />}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {dayjs(createdAt).fromNow()}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (isInProgress) {
    return <div className="qt-in-progress-border rounded-lg p-px">{card}</div>;
  }

  return card;
}
