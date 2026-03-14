"use client";

import type { Id } from "@conductor/backend";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import { IconGitBranch, IconTrash, IconPencil } from "@tabler/icons-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
} from "@conductor/ui";
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
  members?: Array<Id<"users">>;
  projectLead?: Id<"users">;
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
  members,
  projectLead,
  onDelete,
}: ProjectCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description ?? "");
  const updateProject = useMutation(api.projects.update);
  const currentUserId = useQuery(api.auth.me);
  const memberIds = [
    ...new Set(
      [projectLead, ...(members ?? [])].filter(
        (id): id is Id<"users"> => id !== undefined,
      ),
    ),
  ];
  const isOwner = currentUserId === userId;

  const hasContextActions =
    !!branchName || isOwner || currentUserId === undefined;
  const previewText = description ?? rawInput;

  const MAX_AVATARS = 3;
  const allAvatarIds = memberIds.length > 0 ? memberIds : [userId];
  const shownAvatarIds = allAvatarIds.slice(0, MAX_AVATARS);
  const hiddenCount = allAvatarIds.length - MAX_AVATARS;

  const cardContent = (
    <div className="group relative shrink-0 overflow-hidden rounded-lg bg-card/88 transition-[transform,background-color] duration-200 hover:-translate-y-[1px] hover:bg-card hover:z-10">
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div
        className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${accentColor}`}
      />
      <div
        role="button"
        tabIndex={0}
        className="relative z-[1] block w-full cursor-pointer p-2 pl-3 text-left motion-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        onClick={() => setModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") setModalOpen(true);
          if (event.key === " ") {
            event.preventDefault();
            setModalOpen(true);
          }
        }}
      >
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold leading-5 text-foreground transition-colors duration-200 group-hover:text-primary">
            {title}
          </h3>
        </div>
        {previewText ? (
          <p
            className={`mt-1 line-clamp-1 text-xs leading-relaxed ${description ? "text-muted-foreground" : "italic text-muted-foreground/80"}`}
          >
            {previewText}
          </p>
        ) : null}
        <ProjectProgressBar
          projectId={projectId}
          className="mt-2 h-1.5 bg-secondary/75"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 items-center">
            <div className="flex shrink-0 -space-x-1.5 items-center pr-1">
              {shownAvatarIds.map((id) => (
                <UserInitials key={id} userId={id} hideLastSeen />
              ))}
              {hiddenCount > 0 && (
                <div className="-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-semibold text-muted-foreground">
                  +{hiddenCount}
                </div>
              )}
            </div>
          </div>
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
            <Input
              placeholder="Title"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              autoFocus
            />
            <Textarea
              placeholder="Description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              rows={3}
            />
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
        createdAt={createdAt}
        projectUrl={projectUrl}
      />
    </div>
  );

  if (!hasContextActions) {
    return cardContent;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
      <ContextMenuContent>
        {branchName ? (
          <ContextMenuItem asChild>
            <a
              href={`https://github.com/${repoFullName}/tree/${branchName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconGitBranch size={16} />
              View Branch
            </a>
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem
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
        </ContextMenuItem>
        <ContextMenuItem
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
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
