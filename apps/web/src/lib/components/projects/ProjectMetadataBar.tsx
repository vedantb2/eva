"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, getAIModelProvider, normalizeAIModel } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  ModelSelect,
} from "@conductor/ui";
import {
  IconUsers,
  type IconCalendar,
  IconUser,
  IconUserPlus,
  IconCalendarEvent,
  IconCalendarDue,
  IconGitBranch,
  IconInfoCircle,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import {
  FALLBACK_GIT_BASE_BRANCH,
  UserInitials,
  getUserInitials,
} from "@conductor/shared";
import { Facehash } from "facehash";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  ProjectPhaseBadge,
  phaseConfig,
  ACTIVE_PROJECT_PHASES,
  type ProjectPhase,
} from "./ProjectPhaseBadge";
import { PriorityPicker } from "@/lib/components/priority/PriorityPicker";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { ProjectTagsPopover } from "./_components/ProjectTagsPopover";
import { ScreenshotsToggle } from "@/lib/components/quick-tasks/ScreenshotsToggle";
import { AuditToggle } from "@/lib/components/quick-tasks/AuditToggle";

const GHOST_TRIGGER_CLASS =
  "h-8 w-auto border-0 shadow-none bg-transparent px-2 focus:ring-0 focus:ring-offset-0 hover:bg-muted/60 rounded-lg text-[13px] [&>svg:last-child]:hidden shrink-0";

interface ProjectMetadataBarProps {
  projectId: Id<"projects">;
}

export function ProjectMetadataBar({ projectId }: ProjectMetadataBarProps) {
  const { repo } = useRepo();
  const project = useQuery(api.projects.get, { id: projectId });
  const users = useQuery(api.users.listAll);
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
          screenshotsVideosEnabled,
          runAuditEnabled,
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
            ...(screenshotsVideosEnabled !== undefined
              ? {
                  screenshotsVideosEnabled:
                    screenshotsVideosEnabled ?? undefined,
                }
              : {}),
            ...(runAuditEnabled !== undefined
              ? { runAuditEnabled: runAuditEnabled ?? undefined }
              : {}),
          },
        );
      }
    },
  );

  const displayName = (user: NonNullable<typeof users>[number]) =>
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Unnamed User";

  const currentModel = normalizeAIModel(project?.model);
  const { options: modelOptions } = useAvailableAiModels(
    project?.repoId,
    currentModel,
  );
  const { options: accounts, resolveId: resolveAccountId } =
    useProviderAccounts();
  const currentUserId = useQuery(api.auth.me);

  if (!project) return null;

  const isOwner =
    currentUserId !== undefined && currentUserId === project.userId;
  const creator = (users ?? []).find((user) => user._id === project.userId);
  const ownerAccountLabel =
    creator?.firstName?.trim() || creator?.fullName?.trim() || "Personal";
  const displayAccounts =
    isOwner || !project.providerAccountId
      ? accounts
      : [
          {
            id: project.providerAccountId,
            provider: getAIModelProvider(currentModel),
            label: ownerAccountLabel,
          },
          ...accounts,
        ];
  const displayBaseBranch =
    project.baseBranch ?? repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;
  const reviewers = (users ?? []).filter((u) => u.role === "dev");
  const reviewerUser = project.codeReviewer
    ? users?.find((u) => u._id === project.codeReviewer)
    : undefined;

  return (
    <div className="flex items-center gap-0.5 px-3 sm:px-4 py-1 overflow-x-auto scrollbar-none">
      <div className="flex items-center h-8 shrink-0">
        {project.phase === "draft" || project.phase === "finalized" ? (
          <div className="px-2">
            <ProjectPhaseBadge phase={project.phase} />
          </div>
        ) : (
          <ProjectPhaseSelect
            value={project.phase}
            onChange={(phase) => updateProject({ id: projectId, phase })}
          />
        )}
      </div>
      <div className="flex items-center h-8 shrink-0 gap-1.5 px-2 text-[13px] text-muted-foreground">
        <IconGitBranch size={14} />
        <span className="text-foreground">{displayBaseBranch}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconInfoCircle size={12} className="cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            Base branch for all tasks in this project
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center h-8 shrink-0">
        <PriorityPicker
          value={project.priority}
          onChange={(p) =>
            updateProject({ id: projectId, priority: p ?? null })
          }
        />
      </div>
      <Select
        value={project.projectLead ?? "none"}
        onValueChange={(val) =>
          updateProject({
            id: projectId,
            projectLead:
              val === "none"
                ? null
                : ((users ?? []).find((u) => u._id === val)?._id ?? null),
          })
        }
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue>
            <div
              className={`flex items-center gap-1.5 ${!project.projectLead ? "text-muted-foreground" : ""}`}
            >
              <IconUser size={14} className="text-muted-foreground" />
              <span>
                {project.projectLead
                  ? (() => {
                      const lead = (users ?? []).find(
                        (u) => u._id === project.projectLead,
                      );
                      return lead ? displayName(lead) : "Unknown";
                    })()
                  : "Project Lead"}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Project Lead</SelectLabel>
            <SelectItem value="none">Unassigned</SelectItem>
            {(users ?? []).map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {displayName(user)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={project.codeReviewer ?? "none"}
        onValueChange={(val) =>
          updateProject({
            id: projectId,
            codeReviewer:
              val === "none"
                ? null
                : ((users ?? []).find((u) => u._id === val)?._id ?? null),
          })
        }
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue>
            <div
              className={`flex items-center gap-1.5 ${!project.codeReviewer ? "text-muted-foreground" : ""}`}
            >
              {reviewerUser ? (
                <Facehash
                  size={16}
                  name={getUserInitials(reviewerUser)}
                  enableBlink
                />
              ) : (
                <IconUserPlus size={14} className="text-muted-foreground" />
              )}
              <span>
                {reviewerUser ? displayName(reviewerUser) : "Code Reviewer"}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Code Reviewer</SelectLabel>
            <SelectItem value="none">Unassigned</SelectItem>
            {reviewers.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                <div className="flex items-center gap-1.5">
                  <Facehash
                    size={16}
                    name={getUserInitials(user)}
                    enableBlink
                  />
                  <span>{displayName(user)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`flex items-center h-8 rounded-lg hover:bg-muted/60 transition-colors px-2 gap-1.5 text-[13px] shrink-0 ${!project.members?.length ? "text-muted-foreground" : ""}`}
          >
            <IconUsers size={14} className="text-muted-foreground shrink-0" />
            <span>
              {project.members?.length
                ? `${project.members.length} member${project.members.length > 1 ? "s" : ""}`
                : "Members"}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {(users ?? []).map((user) => {
            const isMember = project.members?.includes(user._id) ?? false;
            return (
              <DropdownMenuCheckboxItem
                key={user._id}
                checked={isMember}
                onCheckedChange={() => {
                  const current = project.members ?? [];
                  const next = isMember
                    ? current.filter((id) => id !== user._id)
                    : [...current, user._id];
                  updateProject({ id: projectId, members: next });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                {displayName(user)}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectTagsPopover
        tags={project.tags}
        onUpdate={(tags) => updateProject({ id: projectId, tags })}
      />

      <div className="flex items-center h-8 shrink-0">
        <ModelSelect
          value={currentModel}
          options={modelOptions}
          onValueChange={(nextModel) =>
            updateProject({ id: projectId, model: nextModel })
          }
          accounts={displayAccounts}
          accountId={project.providerAccountId ?? null}
          onAccountChange={(nextAccountId) => {
            if (!isOwner) return;
            updateProject({
              id: projectId,
              providerAccountId: resolveAccountId(nextAccountId) ?? null,
            });
          }}
          className="px-0"
        />
      </div>

      <div className="flex items-center h-8 shrink-0">
        <ScreenshotsToggle
          value={project.screenshotsVideosEnabled === true}
          onChange={(next) =>
            updateProject({
              id: projectId,
              screenshotsVideosEnabled: next,
            })
          }
        />
      </div>

      <div className="flex items-center h-8 shrink-0">
        <AuditToggle
          value={project.runAuditEnabled === true}
          onChange={(next) =>
            updateProject({ id: projectId, runAuditEnabled: next })
          }
        />
      </div>

      <DatePickerField
        label="Start Date"
        icon={IconCalendarEvent}
        value={project.projectStartDate}
        onChange={(date) =>
          updateProject({
            id: projectId,
            projectStartDate: date ?? undefined,
          })
        }
      />

      <DatePickerField
        label="End Date"
        icon={IconCalendarDue}
        value={project.projectEndDate}
        onChange={(date) =>
          updateProject({
            id: projectId,
            projectEndDate: date ?? undefined,
          })
        }
      />
      <div className="ml-auto flex shrink-0 items-center gap-1.5 px-2 text-xs text-muted-foreground">
        {creator ? (
          <>
            <UserInitials userId={creator._id} size="sm" />
            <span>{displayName(creator)}</span>
            <span>·</span>
          </>
        ) : null}
        <span>{dayjs(project._creationTime).format("DD/MM/YYYY HH:mm")}</span>
      </div>
    </div>
  );
}

/**
 * Editable status (phase) dropdown for the metadata bar. Controlled: the parent
 * owns the mutation. Only offers active phases (ACTIVE_PROJECT_PHASES) as targets
 * — draft/finalized are driven by the planning flow and rendered as a read-only
 * badge by the parent, so `value` here is always one of the offered options.
 */
function ProjectPhaseSelect({
  value,
  onChange,
}: {
  value: ProjectPhase;
  onChange: (phase: ProjectPhase) => void;
}) {
  const config = phaseConfig[value];
  const Icon = config.icon;

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        const matched = ACTIVE_PROJECT_PHASES.find((p) => p === val);
        if (matched) onChange(matched);
      }}
    >
      <SelectTrigger className={GHOST_TRIGGER_CLASS}>
        <SelectValue>
          <div className={`flex items-center gap-1.5 ${config.text}`}>
            <Icon size={14} />
            <span>{config.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Status</SelectLabel>
          {ACTIVE_PROJECT_PHASES.map((p) => {
            const phaseOption = phaseConfig[p];
            const PhaseIcon = phaseOption.icon;
            return (
              <SelectItem key={p} value={p}>
                <div
                  className={`flex items-center gap-1.5 ${phaseOption.text}`}
                >
                  <PhaseIcon size={14} />
                  <span>{phaseOption.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function DatePickerField({
  label,
  value,
  icon: Icon,
  iconClassName,
  onChange,
}: {
  label: string;
  value: number | undefined;
  icon: typeof IconCalendar;
  iconClassName?: string;
  onChange: (epoch: number | null) => void;
}) {
  const selected = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center h-8 rounded-lg hover:bg-muted/60 transition-colors px-2 gap-1.5 text-[13px] shrink-0 whitespace-nowrap ${!selected ? "text-muted-foreground" : ""}`}
        >
          <Icon
            size={14}
            className={iconClassName ?? "text-muted-foreground"}
          />
          <span>
            {selected ? dayjs(selected).format("MMM D, YYYY") : label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? date.getTime() : null)}
        />
      </PopoverContent>
    </Popover>
  );
}
