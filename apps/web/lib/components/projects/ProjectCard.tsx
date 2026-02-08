"use client";

import type { Id } from "@conductor/backend";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import Link from "next/link";
import {
  IconGitBranch,
  IconDots,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Textarea,
} from "@conductor/ui";
import dayjs from "@/lib/dates";
import { ProjectProgressBar } from "./ProjectProgressBar";

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
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description ?? "");
  const updateProject = useMutation(api.projects.update);
  const currentUserId = useQuery(api.auth.me);
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
              disabled={!isOwner}
              onClick={() => {
                setEditTitle(title);
                setEditDescription(description ?? "");
                setEditOpen(true);
              }}
            >
              <IconPencil size={16} className="mr-2 h-4 w-4" />
              Edit Details
              {!isOwner && (
                <span className="text-xs text-muted-foreground ml-2">
                  Owner only
                </span>
              )}
            </DropdownMenuItem>
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
        <ProjectProgressBar projectId={projectId} className="mt-2" />
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await updateProject({
                id: projectId,
                title: editTitle,
                description: editDescription || undefined,
              });
              setEditOpen(false);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!editTitle.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
