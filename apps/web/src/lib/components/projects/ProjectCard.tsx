"use client";

import type { Id } from "@eva/backend";
import { useState, type MouseEvent } from "react";
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
  ListRow,
  StatusDot,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@eva/ui";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";
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
  /** Public (slash) path; rendered via router Link so rewrites own the href. */
  href?: string;
  /**
   * Plain-click handler. Call `event.preventDefault()` to cancel Link
   * navigation (e.g. while a dialog is open).
   */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
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

  const cardContent = (
    <ListRow
      className="shrink-0"
      accentClassName={accentColor}
      selected={isActive}
      link={
        href ? (
          <DynamicLink to={toInternalRepoHref(href)} search={true} />
        ) : undefined
      }
      onClick={
        editOpen || onClick
          ? (event) => {
              if (editOpen) {
                event.preventDefault();
                return;
              }
              onClick?.(event);
            }
          : undefined
      }
      aria-label={title}
      contentClassName="flex flex-col gap-1.5 px-3 py-2.5 pl-3.5"
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1">
          <MarqueeOnHover className="min-w-0 text-2sm font-medium leading-5 tracking-[-0.01em] text-foreground transition-colors duration-200 group-hover:text-primary">
            {title}
          </MarqueeOnHover>
          {previewText ? (
            <p
              className={cn(
                "mt-1 line-clamp-2 text-xs leading-relaxed text-pretty",
                description
                  ? "text-muted-foreground"
                  : "italic text-muted-foreground/80",
              )}
            >
              {previewText}
            </p>
          ) : null}
        </div>
        {sandboxStatus ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* `after:` pseudo widens the pointer target past the 8px dot. */}
              <StatusDot
                tone={SANDBOX_STATUS_STYLES[sandboxStatus].tone}
                size="md"
                className="relative mt-1.5 after:absolute after:inset-[-8px]"
              />
            </TooltipTrigger>
            <TooltipContent>
              {SANDBOX_STATUS_STYLES[sandboxStatus].label}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="gap-0.5 px-1.5 py-0 text-3xs font-medium leading-4"
            >
              {planningMode === "interview" ? (
                <IconSparkles className="size-2.5 shrink-0" />
              ) : (
                <IconListCheck className="size-2.5 shrink-0" />
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

      <div className="mt-0.5 pt-0.5">
        <ProjectProgressBar
          projectId={projectId}
          className="h-1 bg-secondary/80"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <AvatarStack size={18} className="-space-x-0.5">
              {shownAvatarIds.map((id) => (
                <UserInitials key={id} userId={id} hideLastSeen />
              ))}
            </AvatarStack>
            {hiddenCount > 0 ? (
              <span className="text-2xs font-medium tabular-nums text-muted-foreground">
                +{hiddenCount}
              </span>
            ) : null}
          </div>
          {branchName ? (
            <span className="max-w-[45%] truncate font-mono text-3xs tabular-nums text-muted-foreground/65">
              {branchName}
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
    </ListRow>
  );

  const wrappedCard = isBuilding ? (
    <div className="qt-in-progress-border p-px">{cardContent}</div>
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
            <IconUserPlus className="size-4" />
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
            <IconExternalLink className="size-4" />
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
              <IconGitBranch className="size-4" />
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
          <IconPencil className="size-4" />
          Edit Details
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            void navigator.clipboard.writeText(title);
          }}
        >
          <IconClipboard className="size-4" />
          Copy title
        </ContextMenuItem>
        {branchName ? (
          <ContextMenuItem
            onClick={() => {
              void navigator.clipboard.writeText(branchName);
            }}
          >
            <IconCopy className="size-4" />
            Copy branch name
          </ContextMenuItem>
        ) : null}
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={onDelete}>
          <IconTrash className="size-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
