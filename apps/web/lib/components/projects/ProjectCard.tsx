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
  IconClock,
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
  accentColor: string;
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
  accentColor,
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

  const hasDropdownActions =
    !!branchName || isOwner || currentUserId === undefined;
  const previewText = description ?? rawInput;

  const MAX_AVATARS = 3;
  const allAvatarIds =
    participantIds.length > 0 ? participantIds : [userId as string | undefined];
  const shownAvatarIds = allAvatarIds.slice(0, MAX_AVATARS);
  const hiddenCount = allAvatarIds.length - MAX_AVATARS;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/88 shadow-sm backdrop-blur-md transition-[transform,border-color,box-shadow,background-color] duration-200 hover:-translate-y-[1px] hover:border-primary/25 hover:shadow-md hover:z-10">
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div
        className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${accentColor}`}
      />
      {hasDropdownActions && (
        <div className="absolute right-2 top-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="motion-press flex shrink-0 rounded-full border border-transparent bg-background/45 text-muted-foreground backdrop-blur-sm hover:scale-105 hover:border-border/65 hover:bg-background/80 hover:text-foreground active:scale-95"
                onClick={(event) => event.stopPropagation()}
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
                  <span className="ml-2 text-xs text-muted-foreground">
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
                  <span className="ml-2 text-xs text-muted-foreground">
                    Owner only
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        className="relative z-[1] block w-full cursor-pointer p-3 text-left motion-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        onClick={() => setModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") setModalOpen(true);
          if (event.key === " ") {
            event.preventDefault();
            setModalOpen(true);
          }
        }}
      >
        <div className="pr-8">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground transition-colors duration-200 group-hover:text-primary">
            {title}
          </h3>
        </div>
        {previewText ? (
          <p
            className={`mt-2 line-clamp-2 text-xs leading-relaxed ${description ? "text-muted-foreground" : "italic text-muted-foreground/80"}`}
          >
            {previewText}
          </p>
        ) : null}
        <ProjectProgressBar
          projectId={projectId}
          className="mt-3 h-2 bg-secondary/75"
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center">
            <div className="flex shrink-0 -space-x-1.5 items-center pr-1">
              {shownAvatarIds.map((id) =>
                id ? (
                  <UserInitials
                    key={id}
                    userId={id as Id<"users">}
                    hideLastSeen
                  />
                ) : null,
              )}
              {hiddenCount > 0 && (
                <div className="-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-semibold text-muted-foreground">
                  +{hiddenCount}
                </div>
              )}
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <IconClock size={12} />
            {dayjs(createdAt).fromNow()}
          </span>
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
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
                onChange={(event) => setEditTitle(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
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
