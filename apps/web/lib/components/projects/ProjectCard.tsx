"use client";

import type { Id } from "@conductor/backend";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
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
import dayjs from "@conductor/shared/dates";
import { ProjectProgressBar } from "./ProjectProgressBar";
import { ProjectCardModal } from "./ProjectCardModal";

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
  const [modalOpen, setModalOpen] = useState(false);
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
      className={`group relative rounded-xl border border-border p-2 transition-all duration-200 ${cardBg} hover:-translate-y-0.5 hover:shadow-sm`}
    >
      <div className="absolute top-1.5 right-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="motion-press flex shrink-0 text-muted-foreground hover:scale-105 hover:text-foreground active:scale-95"
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
                <IconGitBranch size={16} />
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
              <IconPencil size={16} />
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
              <IconTrash size={16} />
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
      <button
        type="button"
        className="block w-full cursor-pointer rounded-lg text-left motion-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-center gap-2 mb-1 pr-8">
          <h3 className="truncate text-sm font-semibold text-foreground transition-all duration-200 group-hover:text-primary">
            {title}
          </h3>
        </div>
        {description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        ) : rawInput ? (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {rawInput}
          </p>
        ) : null}
        <ProjectProgressBar projectId={projectId} className="mt-2" />
        <div className="mt-2.5 flex items-center justify-between">
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
      </button>
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
      <ProjectCardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        projectUrl={projectUrl}
      />
    </div>
  );
}
