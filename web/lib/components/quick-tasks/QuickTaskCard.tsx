"use client";

import {
  Card,
  CardContent,
  Checkbox,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import type { Id } from "conductor-backend";
import { SubtaskProgress } from "@/lib/components/tasks/SubtaskList";
import {
  IconGitBranch,
  IconGitPullRequest,
  IconDotsVertical,
} from "@tabler/icons-react";
import dayjs from "@/lib/dates";
import { useQuery } from "convex/react";
import { api } from "conductor-backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@/lib/components/ui/UserInitials";
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
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const hasError = runs?.[0]?.status === "error";

  return (
    <Card
      className={`w-full shadow cursor-pointer ${statusConfig[status].cardBg} ${hasError ? "border-2 border-destructive" : ""} ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={isSelecting ? undefined : onClick}
    >
      <CardContent className="p-2 gap-1">
        <div className="flex items-center justify-between gap-2">
          {isSelecting && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.()}
              className="flex-shrink-0"
            />
          )}
          <h4 className="font-medium text-sm line-clamp-1 flex-1">{title}</h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SubtaskProgress taskId={id} />
            {(branchName || latestPrUrl) && (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <IconDotsVertical
                        size={14}
                        className="text-muted-foreground"
                      />
                    </button>
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
                        <IconGitBranch className="mr-2 h-4 w-4" />
                        View Branch
                      </DropdownMenuItem>
                    )}
                    {latestPrUrl && (
                      <DropdownMenuItem
                        onClick={() => window.open(latestPrUrl, "_blank")}
                      >
                        <IconGitPullRequest className="mr-2 h-4 w-4" />
                        View PR
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          {createdBy && <UserInitials userId={createdBy} />}
          <span className="text-xs text-muted-foreground ml-auto">
            {dayjs(createdAt).fromNow()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
