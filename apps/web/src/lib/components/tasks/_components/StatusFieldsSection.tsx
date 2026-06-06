"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api, normalizeAIModel } from "@conductor/backend";
import type { Doc, Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
  Input,
  ModelSelect,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@conductor/ui";
import {
  IconUserPlus,
  IconFolder,
  IconFolderPlus,
  IconTags,
  IconGitBranch,
  IconInfoCircle,
  IconBrandVercelFilled,
  IconChevronDown,
  IconCamera,
  IconCameraOff,
} from "@tabler/icons-react";
import { UserInitials, getUserInitials } from "@conductor/shared";
import { Facehash } from "facehash";
import {
  statusConfig,
  TASK_STATUSES,
  type TaskStatus,
} from "../TaskStatusBadge";
import { PriorityIcon } from "@/lib/components/priority/PriorityIcon";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  type Priority,
} from "@/lib/components/priority/priorityMeta";
import { BranchSelect } from "@/lib/components/BranchSelect";
import {
  GHOST_TRIGGER_CLASS,
  DEPLOYMENT_STATUS_CONFIG,
  getUserDisplayName,
  NO_PROJECT_VALUE,
  NEW_PROJECT_VALUE,
  NO_PRIORITY_VALUE,
  UNASSIGNED_VALUE,
  SCREENSHOTS_INHERIT_VALUE,
  SCREENSHOTS_ON_VALUE,
  SCREENSHOTS_OFF_VALUE,
} from "./task-detail-constants";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { useRepo } from "@/lib/contexts/RepoContext";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";

type RunDoc = NonNullable<
  FunctionReturnType<typeof api.agentRuns.listByTask>
>[number];

interface StatusFieldsSectionProps {
  taskId: Id<"agentTasks">;
  task: Doc<"agentTasks"> | undefined;
  status: TaskStatus | undefined;
  isBlocked: boolean | undefined;
  users: FunctionReturnType<typeof api.users.listAll> | undefined;
  projects: FunctionReturnType<typeof api.projects.list> | undefined;
  baseBranch: string;
  setBaseBranch: (v: string) => void;
  latestDeployment: RunDoc | undefined;
  hasActiveRun: boolean;
  allTags: string[];
  requestingChanges: boolean;
}

export function StatusFieldsSection({
  taskId,
  task,
  status,
  isBlocked,
  users,
  projects,
  baseBranch,
  setBaseBranch,
  latestDeployment,
  hasActiveRun,
  allTags,
  requestingChanges,
}: StatusFieldsSectionProps) {
  const updateTask = useMutation(api.agentTasks.update).withOptimisticUpdate(
    (localStore, args) => {
      if (!task?.repoId) return;
      const {
        id: _id,
        repoId: _repoId,
        priority,
        projectId,
        assignedTo,
        screenshotsVideosEnabled,
        ...safeFields
      } = args;
      const nullSafe = {
        ...safeFields,
        ...(priority !== undefined ? { priority: priority ?? undefined } : {}),
        ...(projectId !== undefined
          ? { projectId: projectId ?? undefined }
          : {}),
        ...(assignedTo !== undefined
          ? { assignedTo: assignedTo ?? undefined }
          : {}),
        ...(screenshotsVideosEnabled !== undefined
          ? { screenshotsVideosEnabled: screenshotsVideosEnabled ?? undefined }
          : {}),
      };
      const list = localStore.getQuery(api.agentTasks.getAllTasks, {
        repoId: task.repoId,
      });
      if (list !== undefined) {
        localStore.setQuery(
          api.agentTasks.getAllTasks,
          { repoId: task.repoId },
          list.map((t) => (t._id === args.id ? { ...t, ...nullSafe } : t)),
        );
      }
      const cached = localStore.getQuery(api.agentTasks.get, { id: args.id });
      if (cached) {
        localStore.setQuery(
          api.agentTasks.get,
          { id: args.id },
          {
            ...cached,
            ...nullSafe,
          },
        );
      }
    },
  );
  const updateStatus = useMutation(
    api.agentTasks.updateStatus,
  ).withOptimisticUpdate((localStore, args) => {
    if (!task?.repoId) return;
    const list = localStore.getQuery(api.agentTasks.getAllTasks, {
      repoId: task.repoId,
    });
    if (list !== undefined) {
      localStore.setQuery(
        api.agentTasks.getAllTasks,
        { repoId: task.repoId },
        list.map((t) =>
          t._id === args.id ? { ...t, status: args.status } : t,
        ),
      );
    }
    const cached = localStore.getQuery(api.agentTasks.get, { id: args.id });
    if (cached) {
      localStore.setQuery(
        api.agentTasks.get,
        { id: args.id },
        {
          ...cached,
          status: args.status,
        },
      );
    }
  });
  const { repo } = useRepo();
  const [tagDraft, setTagDraft] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const tagDraftRef = useRef<HTMLInputElement>(null);

  const addTag = async (raw: string) => {
    const value = raw.trim();
    if (!value || !task) return;
    const current = task.tags ?? [];
    if (current.includes(value)) return;
    await updateTask({ id: taskId, tags: [...current, value] });
  };

  const removeTag = async (tag: string) => {
    if (!task) return;
    const next = (task.tags ?? []).filter((t) => t !== tag);
    await updateTask({ id: taskId, tags: next });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagDraft.trim()) {
      e.preventDefault();
      void addTag(tagDraft);
      setTagDraft("");
    }
    if (
      e.key === "Backspace" &&
      tagDraft === "" &&
      (task?.tags?.length ?? 0) > 0
    ) {
      const tags = task?.tags ?? [];
      void removeTag(tags[tags.length - 1]);
    }
  };

  const projectOptions = projects ?? [];
  const hasSelectedProject =
    task?.projectId !== undefined &&
    projectOptions.some((project) => project._id === task.projectId);
  const selectedProjectValue = task?.projectId ?? NO_PROJECT_VALUE;
  const selectedProjectTitle =
    selectedProjectValue !== NO_PROJECT_VALUE
      ? (projectOptions.find((p) => p._id === selectedProjectValue)?.title ??
        "Project")
      : "Project";
  const assignedUser = task?.assignedTo
    ? users?.find((u) => u._id === task.assignedTo)
    : undefined;
  const assignedDisplayName = assignedUser
    ? getUserDisplayName(assignedUser)
    : "Unnamed User";
  const reviewers = (users ?? []).filter((u) => u.role === "dev");
  const currentModel = normalizeAIModel(task?.model);
  const { options: modelOptions } = useAvailableAiModels(
    task?.repoId,
    currentModel,
  );
  const canEditModel = status === "todo" || requestingChanges;

  return (
    <div className="space-y-0.5">
      <Select
        value={status ?? ""}
        onValueChange={(val) => {
          const matched = TASK_STATUSES.find((s) => s === val);
          if (matched) {
            updateStatus({ id: taskId, status: matched });
          }
        }}
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue placeholder="Status">
            {status
              ? (() => {
                  const config = statusConfig[status];
                  const Icon = config.icon;
                  return (
                    <div className={`flex items-center gap-1.5 ${config.text}`}>
                      <Icon size={14} />
                      <span>{config.label}</span>
                      {isBlocked && (
                        <Badge variant="warning" className="ml-0.5">
                          Blocked
                        </Badge>
                      )}
                    </div>
                  );
                })()
              : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Status</SelectLabel>
            {TASK_STATUSES.map((s) => {
              const config = statusConfig[s];
              const Icon = config.icon;
              return (
                <SelectItem key={s} value={s}>
                  <div className={`flex items-center gap-1.5 ${config.text}`}>
                    <Icon size={14} />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={task?.priority ?? NO_PRIORITY_VALUE}
        onValueChange={(val) => {
          if (val === NO_PRIORITY_VALUE) {
            updateTask({ id: taskId, priority: null });
            return;
          }
          const matched = PRIORITY_ORDER.find((p) => p === val);
          if (matched) {
            updateTask({ id: taskId, priority: matched });
          }
        }}
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue>
            <div
              className={`flex items-center gap-1.5 ${task?.priority ? "" : "text-muted-foreground"}`}
            >
              <PriorityIcon level={task?.priority} size={14} />
              <span>
                {task?.priority ? PRIORITY_LABELS[task.priority] : "Priority"}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Priority</SelectLabel>
            <SelectItem value={NO_PRIORITY_VALUE}>
              <div className="flex items-center gap-1.5">
                <PriorityIcon level={undefined} size={14} />
                <span>No priority</span>
              </div>
            </SelectItem>
            {PRIORITY_ORDER.map((p: Priority) => (
              <SelectItem key={p} value={p}>
                <div className="flex items-center gap-1.5">
                  <PriorityIcon level={p} size={14} />
                  <span>{PRIORITY_LABELS[p]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={
          task?.screenshotsVideosEnabled === undefined
            ? SCREENSHOTS_INHERIT_VALUE
            : task.screenshotsVideosEnabled
              ? SCREENSHOTS_ON_VALUE
              : SCREENSHOTS_OFF_VALUE
        }
        onValueChange={(val) => {
          if (val === SCREENSHOTS_INHERIT_VALUE) {
            updateTask({ id: taskId, screenshotsVideosEnabled: null });
          } else if (val === SCREENSHOTS_ON_VALUE) {
            updateTask({ id: taskId, screenshotsVideosEnabled: true });
          } else if (val === SCREENSHOTS_OFF_VALUE) {
            updateTask({ id: taskId, screenshotsVideosEnabled: false });
          }
        }}
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue>
            {(() => {
              const isOverride = task?.screenshotsVideosEnabled !== undefined;
              const repoDefault = repo.screenshotsVideosEnabled ?? false;
              const effective = task?.screenshotsVideosEnabled ?? repoDefault;
              const Icon = effective ? IconCamera : IconCameraOff;
              return (
                <div
                  className={`flex items-center gap-1.5 ${isOverride ? "" : "text-muted-foreground"}`}
                >
                  <Icon size={14} className="text-muted-foreground" />
                  <span>
                    {isOverride
                      ? task?.screenshotsVideosEnabled
                        ? "Proof: on"
                        : "Proof: off"
                      : `Proof: inherit (${repoDefault ? "on" : "off"})`}
                  </span>
                </div>
              );
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Proof of completion</SelectLabel>
            <SelectItem value={SCREENSHOTS_INHERIT_VALUE}>
              <div className="flex items-center gap-1.5">
                <IconCamera size={14} className="text-muted-foreground" />
                <span>
                  Inherit ({repo.screenshotsVideosEnabled ? "on" : "off"})
                </span>
              </div>
            </SelectItem>
            <SelectItem value={SCREENSHOTS_ON_VALUE}>
              <div className="flex items-center gap-1.5">
                <IconCamera size={14} className="text-muted-foreground" />
                <span>Force on</span>
              </div>
            </SelectItem>
            <SelectItem value={SCREENSHOTS_OFF_VALUE}>
              <div className="flex items-center gap-1.5">
                <IconCameraOff size={14} className="text-muted-foreground" />
                <span>Force off</span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={selectedProjectValue}
        onValueChange={(val) => {
          if (val === NEW_PROJECT_VALUE) {
            setIsCreatingProject(true);
            return;
          }
          if (val === NO_PROJECT_VALUE) {
            updateTask({ id: taskId, projectId: null });
          } else {
            const project = projectOptions.find((p) => p._id === val);
            if (project) {
              updateTask({ id: taskId, projectId: project._id });
            }
          }
        }}
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue placeholder="Project">
            <div
              className={`flex items-center gap-1.5 ${selectedProjectValue === NO_PROJECT_VALUE ? "text-muted-foreground" : ""}`}
            >
              <IconFolder size={14} className="text-muted-foreground" />
              <span>{selectedProjectTitle}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Project</SelectLabel>
            <SelectItem value={NO_PROJECT_VALUE}>No project</SelectItem>
            {task?.projectId && !hasSelectedProject && (
              <SelectItem value={task.projectId}>
                <div className="flex items-center gap-1.5">
                  <IconFolder size={14} className="text-muted-foreground" />
                  <span>Current project</span>
                </div>
              </SelectItem>
            )}
            {projectOptions.map((project) => (
              <SelectItem key={project._id} value={project._id}>
                <div className="flex items-center gap-1.5">
                  <IconFolder size={14} className="text-muted-foreground" />
                  <span>{project.title}</span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value={NEW_PROJECT_VALUE}>
              <div className="flex items-center gap-1.5">
                <IconFolderPlus size={14} className="text-muted-foreground" />
                <span>New project...</span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <NewProjectModal
        isOpen={isCreatingProject}
        onClose={() => setIsCreatingProject(false)}
        onCreated={(id) => updateTask({ id: taskId, projectId: id })}
        defaultSkipPlanning
      />

      <Select
        value={task?.assignedTo ?? UNASSIGNED_VALUE}
        onValueChange={(val) => {
          if (val === UNASSIGNED_VALUE) {
            updateTask({ id: taskId, assignedTo: null });
          } else {
            const user = users?.find((u) => u._id === val);
            if (user) updateTask({ id: taskId, assignedTo: user._id });
          }
        }}
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue>
            <div
              className={`flex items-center gap-1.5 ${!task?.assignedTo ? "text-muted-foreground" : ""}`}
            >
              {assignedUser ? (
                <UserInitials user={assignedUser} size="sm" hideLastSeen />
              ) : (
                <IconUserPlus size={14} className="text-muted-foreground" />
              )}
              <span>
                {task?.assignedTo ? assignedDisplayName : "Code Reviewer"}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Code Reviewer</SelectLabel>
            <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
            {reviewers.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                <div className="flex items-center gap-1.5">
                  <Facehash
                    size={16}
                    name={getUserInitials(user)}
                    enableBlink
                  />
                  <span>{getUserDisplayName(user)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div
        className="group/tags flex items-center min-h-[40px] rounded-lg hover:bg-muted/50 transition-colors px-2 gap-1 flex-wrap cursor-text"
        onClick={() => tagDraftRef.current?.focus()}
      >
        <IconTags size={14} className="text-muted-foreground shrink-0" />
        {task?.tags?.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="text-xs h-5 gap-0.5 pr-0.5 group/tag"
          >
            {tag}
            <button
              type="button"
              className="rounded-sm opacity-50 hover:opacity-100 transition-opacity ml-0.5 px-0.5"
              onClick={(e) => {
                e.stopPropagation();
                void removeTag(tag);
              }}
            >
              ×
            </button>
          </Badge>
        ))}
        <Input
          ref={tagDraftRef}
          value={tagDraft}
          placeholder={(task?.tags?.length ?? 0) === 0 ? "Tags" : "Add tag..."}
          className="h-7 border-0 shadow-none bg-transparent px-0 focus-visible:ring-0 text-[13px] min-w-16 flex-1 placeholder:text-muted-foreground"
          onChange={(e) => setTagDraft(e.target.value)}
          onBlur={() => {
            if (tagDraft.trim()) {
              void addTag(tagDraft);
              setTagDraft("");
            }
          }}
          onKeyDown={handleTagKeyDown}
        />
        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <IconChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-56 overflow-y-auto"
            >
              {allTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={(task?.tags ?? []).includes(tag)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      void addTag(tag);
                    } else {
                      void removeTag(tag);
                    }
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center min-h-[40px] rounded-lg px-2 transition-colors hover:bg-muted/50">
        <ModelSelect
          value={currentModel}
          options={modelOptions}
          onValueChange={(nextModel) =>
            updateTask({ id: taskId, model: nextModel })
          }
          disabled={!canEditModel}
          className="px-0"
        />
        {!canEditModel ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <IconInfoCircle
                size={12}
                className="cursor-help text-muted-foreground"
              />
            </TooltipTrigger>
            <TooltipContent>
              Cannot be modified after task has run
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {!task?.projectId && (
        <div className="flex items-center min-h-[40px] rounded-lg hover:bg-muted/50 transition-colors px-2">
          {status === "todo" ? (
            <BranchSelect
              value={baseBranch}
              onValueChange={(val) => {
                setBaseBranch(val);
                updateTask({ id: taskId, baseBranch: val });
              }}
              className="h-7 border-0 shadow-none bg-transparent px-0 hover:bg-transparent text-[13px] [&>svg:last-child]:hidden"
            />
          ) : (
            <div className="flex items-center gap-1.5 text-[13px]">
              <IconGitBranch size={14} className="text-muted-foreground" />
              <span>{baseBranch}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle
                    size={12}
                    className="text-muted-foreground cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Cannot be modified after task has run
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      )}

      {latestDeployment?.deploymentStatus && (
        <div className="flex items-center h-10 rounded-lg hover:bg-muted/50 transition-colors px-2 gap-1.5 text-[13px]">
          <IconBrandVercelFilled
            size={14}
            className={
              DEPLOYMENT_STATUS_CONFIG[latestDeployment.deploymentStatus]
                ?.iconColor ?? "text-muted-foreground"
            }
          />
          <span>
            {DEPLOYMENT_STATUS_CONFIG[latestDeployment.deploymentStatus]
              ?.label ?? "Unknown"}
          </span>
        </div>
      )}
    </div>
  );
}
