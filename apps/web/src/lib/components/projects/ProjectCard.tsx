"use client";

import type { Id } from "@eva/backend";
import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { UserInitials } from "@eva/shared";
import {
  IconGitBranch,
  IconTrash,
  IconPencil,
  IconUserPlus,
  IconClipboard,
  IconCopy,
  IconExternalLink,
  IconListCheck,
  IconSparkles,
} from "@tabler/icons-react";
import {
  AvatarStack,
  Badge,
  cn,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@eva/ui";
import {
  phaseConfig,
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "@/lib/components/sandbox/sandboxStatusStyles";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
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
  planningMode: "interview" | "tasks_only";
  isBuilding?: boolean;
  sandboxStatus?: SandboxStatus;
  isActive?: boolean;
  href?: string;
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
  planningMode,
  isBuilding = false,
  sandboxStatus,
  isActive,
  href,
  onClick,
  onDelete,
}: ProjectCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description ?? "");
  const updateProject = useMutation(api.projects.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.projects.get, { id: projectId });
      if (current !== undefined && current !== null) {
        const {
          id: _id,
          priority,
          projectLead,
          codeReviewer,
          model,
          providerAccountId,
          screenshotsVideosEnabled: _screenshotsVideosEnabled,
          runAuditEnabled: _runAuditEnabled,
          ...safeFields
        } = args;
        localStore.setQuery(
          api.projects.get,
          { id: projectId },
          {
            ...current,
            ...safeFields,
            ...(priority !== undefined
              ? { priority: priority ?? undefined }
              : {}),
            ...(projectLead !== undefined
              ? { projectLead: projectLead ?? undefined }
              : {}),
            ...(codeReviewer !== undefined
              ? { codeReviewer: codeReviewer ?? undefined }
              : {}),
            ...(model !== undefined ? { model: model ?? undefined } : {}),
            ...(providerAccountId !== undefined
              ? { providerAccountId: providerAccountId ?? undefined }
              : {}),
          },
        );
      }
    },
  );
  const currentUserId = useQuery(api.auth.me);
  const users = useQuery(api.users.listAll);
  const memberIds = [
    ...new Set(
      [projectLead, ...(members ?? [])].filter(
        (id): id is Id<"users"> => id !== undefined,
      ),
    ),
  ];
  const previewText = description ?? rawInput;
  const PhaseIcon = phaseConfig[phase].icon;

  const MAX_AVATARS = 3;
  const allAvatarIds = memberIds.length > 0 ? memberIds : [userId];
  const shownAvatarIds = allAvatarIds.slice(0, MAX_AVATARS);
  const hiddenCount = allAvatarIds.length - MAX_AVATARS;

  // The focus ring lives on the outer element, not on the control inside it:
  // `overflow-hidden` here is load-bearing (it clips the blur decoration), and a
  // ring is a box-shadow, so a ring on any child is clipped away entirely. An
  // element is not clipped by its own overflow, so hoisting it makes it visible.
  // Scoped to the control's data-slot — an unscoped `has-[:focus-visible]` would
  // also fire for focusable descendants inside the card body.
  const cardContent = (
    <div
      className={`group relative shrink-0 overflow-hidden rounded-surface border transition-[transform,background-color] duration-200 ease-[var(--motion-ease-out)] has-[[data-slot=card-control]:focus-visible]:ring-2 has-[[data-slot=card-control]:focus-visible]:ring-ring/35 ${
        isActive
          ? "border-primary/30 bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-card shadow-sm hover:bg-muted/40"
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div
        className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${accentColor}`}
      />
      <div
        role="button"
        tabIndex={0}
        data-slot="card-control"
        className="relative z-[1] block w-full cursor-pointer p-2.5 pl-3 text-left motion-base focus-visible:outline-none"
        onClick={(event) => {
          if (href && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            event.stopPropagation();
            window.open(href, "_blank");
            return;
          }
          onClick?.();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick?.();
          }
        }}
      >
        <div className="flex min-w-0 items-start gap-1.5">
          <MarqueeOnHover className="min-w-0 flex-1 text-sm font-semibold leading-5 text-foreground transition-colors duration-200 group-hover:text-primary">
            {title}
          </MarqueeOnHover>
          {sandboxStatus ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    SANDBOX_STATUS_STYLES[sandboxStatus].dot,
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                {SANDBOX_STATUS_STYLES[sandboxStatus].label}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {previewText ? (
          <p
            className={`mt-1.5 line-clamp-1 text-xs leading-relaxed ${description ? "text-muted-foreground" : "italic text-muted-foreground/80"}`}
          >
            {previewText}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="gap-0.5 px-1.5 py-0 text-[10px] font-medium leading-4"
              >
                {planningMode === "interview" ? (
                  <IconSparkles size={10} className="shrink-0" />
                ) : (
                  <IconListCheck size={10} className="shrink-0" />
                )}
                {planningMode === "interview" ? "Interview" : "Tasks only"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {planningMode === "interview"
                ? "Created with AI interview and generated plan"
                : "Created as a tasks-only container"}
            </TooltipContent>
          </Tooltip>
        </div>
        <ProjectProgressBar
          projectId={projectId}
          className="mt-4 h-1.5 bg-secondary/75"
        />
        <div className="mt-3 flex items-center gap-1.5">
          <AvatarStack size={20} className="-space-x-0.5">
            {shownAvatarIds.map((id) => (
              <UserInitials key={id} userId={id} hideLastSeen />
            ))}
          </AvatarStack>
          {hiddenCount > 0 ? (
            <span className="text-[11px] font-medium leading-none text-muted-foreground">
              +{hiddenCount}
            </span>
          ) : null}
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
              rows={6}
              className="min-h-[160px] resize-y"
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

  const wrappedCard = isBuilding ? (
    <div className="qt-in-progress-border rounded-[9px] p-px">
      {cardContent}
    </div>
  ) : (
    cardContent
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{wrappedCard}</ContextMenuTrigger>
      <ContextMenuContent onClick={(e) => e.stopPropagation()}>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
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
          <ContextMenuSubTrigger>
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
                <ContextMenuRadioItem data-pii key={user._id} value={user._id}>
                  {user.fullName ?? user.firstName ?? "Unknown"}
                </ContextMenuRadioItem>
              ))}
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        {href ? (
          <ContextMenuItem
            onClick={() => {
              window.open(href, "_blank");
            }}
          >
            <IconExternalLink size={16} />
            Open in new tab
          </ContextMenuItem>
        ) : null}
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
          onClick={() => {
            setEditTitle(title);
            setEditDescription(description ?? "");
            setEditOpen(true);
          }}
        >
          <IconPencil size={16} />
          Edit Details
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
        <ContextMenuItem className="text-destructive" onClick={onDelete}>
          <IconTrash size={16} />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
