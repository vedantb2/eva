"use client";

import { useState } from "react";
import { Card, CardContent, Button } from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { DependencyBadge } from "@/lib/components/tasks/DependencyBadge";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import {
  IconGitPullRequest,
  IconClock,
  IconPlayerStop,
  IconLoader2,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import dayjs from "@conductor/shared/dates";
import { StopConfirmDialog } from "@/lib/components/tasks/_components/StopConfirmDialog";

interface ProjectTaskCardProps {
  id: Id<"agentTasks">;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  createdBy?: Id<"users">;
  scheduledAt?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ProjectTaskCard({
  id,
  taskNumber,
  title,
  description,
  status,
  createdBy,
  scheduledAt,
  isSelected,
  onClick,
}: ProjectTaskCardProps) {
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId: id });
  const runs = useQuery(api.agentRuns.listByTask, { taskId: id });
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const cancelExecution = useMutation(
    api._taskWorkflow.publicMutations.cancelExecution,
  );
  const [isStopping, setIsStopping] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const isActive = status === "in_progress";

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await cancelExecution({ taskId: id });
    } catch (err) {
      console.error("Failed to stop task:", err);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <Card
      className={`w-full rounded-sm shadow-none transition-all duration-200 ${isSelected ? "ring-2 ring-primary" : ""} ${statusConfig[status].cardBg} ${onClick ? "motion-emphasized cursor-pointer hover:-translate-y-0.5 hover:bg-muted/60 hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 dark:hover:brightness-110" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="p-2 gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground font-mono text-sm flex-shrink-0">
              #{taskNumber}
            </span>
            <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {latestPrUrl && (
              <Link
                href={latestPrUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="motion-press flex-shrink-0 rounded p-1 transition-colors hover:scale-105 hover:bg-muted active:scale-95"
              >
                <IconGitPullRequest size={14} className="text-success" />
              </Link>
            )}
            {scheduledAt && status === "todo" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center text-primary">
                    <IconClock size={14} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Scheduled for {dayjs(scheduledAt).format("MMM D, h:mm A")}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {isActive && (
              <Button
                variant="destructive"
                size="icon-xs"
                className="h-5 w-5 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStopConfirm(true);
                }}
                disabled={isStopping}
              >
                {isStopping ? (
                  <IconLoader2 size={12} className="animate-spin" />
                ) : (
                  <IconPlayerStop size={12} />
                )}
              </Button>
            )}
            <DependencyBadge isBlocked={isBlocked ?? false} status={status} />
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {createdBy && <UserInitials userId={createdBy} />}
          <SubtaskProgress taskId={id} />
        </div>
      </CardContent>
      <StopConfirmDialog
        open={showStopConfirm}
        onOpenChange={setShowStopConfirm}
        onConfirm={handleStop}
        isStopping={isStopping}
      />
    </Card>
  );
}
