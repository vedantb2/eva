"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, normalizeAIModel } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
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
  Spinner,
  ModelSelect,
} from "@conductor/ui";
import {
  IconExternalLink,
  IconUsers,
  IconCalendar,
  IconFlag,
  IconUser,
  IconUserPlus,
  IconCalendarEvent,
  IconCalendarDue,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { getUserInitials } from "@conductor/shared";
import { Facehash } from "facehash";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { ProjectPhaseBadge } from "./ProjectPhaseBadge";
import { ProjectProgressBar } from "./ProjectProgressBar";
import { ProjectTagsPopover } from "./_components/ProjectTagsPopover";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";

const GHOST_TRIGGER_CLASS =
  "h-10 border-0 shadow-none bg-transparent px-2 focus:ring-0 focus:ring-offset-0 hover:bg-muted/60 rounded-lg text-[13px] [&>svg:last-child]:hidden";

interface ProjectDetailInlineProps {
  projectId: Id<"projects">;
  projectUrl: string;
}

export function ProjectDetailInline({
  projectId,
  projectUrl,
}: ProjectDetailInlineProps) {
  const navigate = useNavigate();
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

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const reviewers = (users ?? []).filter((u) => u.role === "dev");
  const reviewerUser = project.codeReviewer
    ? users?.find((u) => u._id === project.codeReviewer)
    : undefined;

  return (
    <div className="flex flex-1 min-h-0 overflow-y-auto scrollbar">
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-6">
          <div className="space-y-4">
            {(project.description || project.rawInput) && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description || project.rawInput}
              </p>
            )}
            <ProjectProgressBar projectId={projectId} />
          </div>

          <div className="pl-0 sm:pl-6 space-y-0.5">
            <div className="flex items-center min-h-[40px] rounded-lg hover:bg-muted/50 transition-colors px-2 gap-1.5 text-[13px]">
              <IconCalendar
                size={14}
                className="text-muted-foreground shrink-0"
              />
              <span>{dayjs(project._creationTime).format("MMM D, YYYY")}</span>
              <span className="text-muted-foreground">
                (<RelativeDateTime at={project._creationTime} />)
              </span>
            </div>

            <div className="flex items-center min-h-[40px] rounded-lg hover:bg-muted/50 transition-colors px-2 gap-1.5 text-[13px]">
              <IconFlag size={14} className="text-muted-foreground shrink-0" />
              <ProjectPhaseBadge phase={project.phase} />
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
                      <IconUserPlus
                        size={14}
                        className="text-muted-foreground"
                      />
                    )}
                    <span>
                      {reviewerUser
                        ? displayName(reviewerUser)
                        : "Code Reviewer"}
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
                  className={`flex items-center w-full min-h-[40px] rounded-lg hover:bg-muted/60 transition-colors px-2 gap-1.5 text-[13px] ${!project.members?.length ? "text-muted-foreground" : ""}`}
                >
                  <IconUsers
                    size={14}
                    className="text-muted-foreground shrink-0"
                  />
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

            <div className="flex items-center min-h-[40px] rounded-lg px-2 transition-colors hover:bg-muted/50">
              <ModelSelect
                value={currentModel}
                options={modelOptions}
                onValueChange={(nextModel) =>
                  updateProject({ id: projectId, model: nextModel })
                }
                accounts={accounts}
                accountId={project.providerAccountId ?? null}
                onAccountChange={(nextAccountId) =>
                  updateProject({
                    id: projectId,
                    providerAccountId: resolveAccountId(nextAccountId) ?? null,
                  })
                }
                className="px-0"
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
          </div>
        </div>

        <div>
          <Button onClick={() => navigate({ to: projectUrl })}>
            <IconExternalLink size={16} />
            Open Project
          </Button>
        </div>
      </div>
    </div>
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
          className={`flex items-center w-full min-h-[40px] rounded-lg hover:bg-muted/60 transition-colors px-2 gap-1.5 text-[13px] ${!selected ? "text-muted-foreground" : ""}`}
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
