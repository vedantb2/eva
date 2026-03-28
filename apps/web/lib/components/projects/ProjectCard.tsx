"use client";

import type { Id } from "@conductor/backend";
import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import {
  IconGitBranch,
  IconTrash,
  IconPencil,
  IconUserPlus,
  IconClipboard,
  IconCopy,
} from "@tabler/icons-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
} from "@conductor/ui";
import {
  phaseConfig,
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
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
  accentColor: string;
  members?: Array<Id<"users">>;
  projectLead?: Id<"users">;
  phase: ProjectPhase;
  isActive?: boolean;
  onClick?: () => void;
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
  accentColor,
  members,
  projectLead,
  phase,
  isActive,
  onClick,
  onDelete,
}: ProjectCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description ?? "");
  const updateProject = useMutation(api.projects.update);
  const currentUserId = useQuery(api.auth.me);
  const users = useQuery(api.users.listAll);
  const memberIds = [
    ...new Set(
      [projectLead, ...(members ?? [])].filter(
        (id): id is Id<"users"> => id !== undefined,
      ),
    ),
  ];
  const isOwner = currentUserId === userId;
  const previewText = description ?? rawInput;
  const PhaseIcon = phaseConfig[phase].icon;

  const MAX_AVATARS = 3;
  const allAvatarIds = memberIds.length > 0 ? memberIds : [userId];
  const shownAvatarIds = allAvatarIds.slice(0, MAX_AVATARS);
  const hiddenCount = allAvatarIds.length - MAX_AVATARS;

  const cardContent = (
    <div
      className={`group relative shrink-0 overflow-hidden rounded-lg transition-[transform,background-color] duration-200 ${
        isActive
          ? "bg-primary/5 ring-1 ring-primary/30"
          : "bg-card/88 hover:-translate-y-[1px] hover:bg-card hover:z-10"
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div
        className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${accentColor}`}
      />
      <div
        role="button"
        tabIndex={0}
        className="relative z-[1] block w-full cursor-pointer p-2 pl-3 text-left motion-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick?.();
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
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!isOwner}>
            <PhaseIcon size={16} className={phaseConfig[phase].text} />
            Phase
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuRadioGroup
              value={phase}
              onValueChange={(value) => {
                const matched = PROJECT_PHASES.find((p) => p === value);
                if (!matched) return;
                void updateProject({
                  id: projectId,
                  phase: matched,
                });
              }}
            >
              {PROJECT_PHASES.map((p) => {
                const cfg = phaseConfig[p];
                const Icon = cfg.icon;
                return (
                  <ContextMenuRadioItem key={p} value={p}>
                    <Icon size={16} className={cfg.text} />
                    {cfg.label}
                  </ContextMenuRadioItem>
                );
              })}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!isOwner}>
            <IconUserPlus size={16} />
            Project Lead
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuRadioGroup
              value={projectLead ?? "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  void updateProject({ id: projectId, projectLead: null });
                  return;
                }
                const matchedUser = (users ?? []).find((u) => u._id === value);
                const leadId =
                  currentUserId === value ? currentUserId : matchedUser?._id;
                if (!leadId) return;
                void updateProject({ id: projectId, projectLead: leadId });
              }}
            >
              {currentUserId ? (
                <>
                  <ContextMenuRadioItem value={currentUserId}>
                    Set myself as lead
                  </ContextMenuRadioItem>
                  <ContextMenuSeparator />
                </>
              ) : null}
              <ContextMenuRadioItem value="none">No lead</ContextMenuRadioItem>
              {(users ?? []).map((user) => (
                <ContextMenuRadioItem key={user._id} value={user._id}>
                  {user.fullName ?? user.firstName ?? "Unknown"}
                </ContextMenuRadioItem>
              ))}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
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
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            void navigator.clipboard.writeText(title);
          }}
        >
          <IconClipboard size={16} />
          Copy title
        </ContextMenuItem>
        {branchName ? (
          <ContextMenuItem
            onClick={() => {
              void navigator.clipboard.writeText(branchName);
            }}
          >
            <IconCopy size={16} />
            Copy branch name
          </ContextMenuItem>
        ) : null}
        <ContextMenuSeparator />
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
