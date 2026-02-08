"use client";

import type { Id } from "@conductor/backend";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import Link from "next/link";
import { IconGitBranch, IconDots, IconTrash } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import dayjs from "@/lib/dates";
import {
  statusConfig,
  TASK_STATUSES,
} from "@/lib/components/tasks/TaskStatusBadge";

interface ProjectCardProps {
  projectId: Id<"projects">;
  userId: Id<"users">;
  title: string;
  description?: string;
  rawInput?: string;
  branchName?: string;
  repoFullName: string;
  createdAt: number;
  projectUrl: string;
  cardBg: string;
  onDelete: () => void;
}

export function ProjectCard({
  projectId,
  userId,
  title,
  description,
  rawInput,
  branchName,
  repoFullName,
  createdAt,
  projectUrl,
  cardBg,
  onDelete,
}: ProjectCardProps) {
  const currentUserId = useQuery(api.auth.me);
  const progress = useQuery(api.projects.getTaskProgress, {
    projectId: projectId as Id<"projects">,
  });
  const project = useQuery(api.projects.get, { id: projectId });
  const participantIds = [
    ...new Set(
      (project?.conversationHistory ?? [])
        .filter((m) => m.userId)
        .map((m) => m.userId),
    ),
  ];
  const isOwner = currentUserId === userId;
  return (
    <div
      className={`p-3 rounded-md shadow transition-all group relative ${cardBg}`}
    >
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-4 flex shrink-0 text-neutral-400 hover:text-neutral-600"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {branchName ? (
              <DropdownMenuItem
                onClick={() =>
                  window.open(
                    `https://github.com/${repoFullName}/tree/${branchName}`,
                    "_blank",
                  )
                }
              >
                <IconGitBranch size={16} className="mr-2 h-4 w-4" />
                View Branch
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="text-destructive"
              disabled={!isOwner}
              onClick={onDelete}
            >
              <IconTrash size={16} className="mr-2 h-4 w-4" />
              Delete
              {!isOwner && (
                <span className="text-xs text-muted-foreground ml-2">
                  Owner only
                </span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Link href={projectUrl} className="block">
        <div className="flex items-center gap-2 mb-1 pr-8">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-primary transition-colors truncate">
            {title}
          </h3>
        </div>
        {description ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {description}
          </p>
        ) : rawInput ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {rawInput}
          </p>
        ) : null}
        {progress && progress.total > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                {TASK_STATUSES.map((status) => {
                  const count = progress[status];
                  if (count === 0) return null;
                  return (
                    <div
                      key={status}
                      className={statusConfig[status].bar}
                      style={{ width: `${(count / progress.total) * 100}%` }}
                    />
                  );
                })}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                {TASK_STATUSES.filter((s) => progress[s] > 0).map((s) => {
                  const Icon = statusConfig[s].icon;
                  return (
                    <span
                      key={s}
                      className={`flex items-center gap-1.5 ${statusConfig[s].text}`}
                    >
                      <Icon size={12} /> {progress[s]} {statusConfig[s].label}
                    </span>
                  );
                })}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-1">
            {participantIds.length > 0 ? (
              participantIds.map((id) => (
                <UserInitials key={id} userId={id!} hideLastSeen />
              ))
            ) : (
              <UserInitials userId={userId} />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {dayjs(createdAt).fromNow()}
          </span>
        </div>
      </Link>
    </div>
  );
}
