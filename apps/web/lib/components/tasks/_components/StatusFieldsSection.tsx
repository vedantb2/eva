"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Doc, Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { CLAUDE_MODELS } from "@conductor/backend";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
  Input,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Badge,
} from "@conductor/ui";
import {
  IconUserPlus,
  IconBrain,
  IconFolder,
  IconTags,
  IconGitBranch,
  IconInfoCircle,
  IconBrandVercelFilled,
} from "@tabler/icons-react";
import {
  statusConfig,
  TASK_STATUSES,
  type TaskStatus,
} from "../TaskStatusBadge";
import { BranchSelect } from "@/lib/components/BranchSelect";
import {
  GHOST_TRIGGER_CLASS,
  DEPLOYMENT_STATUS_CONFIG,
  capitalize,
  getUserDisplayName,
  NO_PROJECT_VALUE,
  UNASSIGNED_VALUE,
} from "./task-detail-constants";

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
}: StatusFieldsSectionProps) {
  const updateTask = useMutation(api.agentTasks.update);
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const [tagDraft, setTagDraft] = useState("");
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
        value={selectedProjectValue}
        onValueChange={(val) => {
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
              <SelectItem value={task.projectId}>Current project</SelectItem>
            )}
            {projectOptions.map((project) => (
              <SelectItem key={project._id} value={project._id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={task?.assignedTo ?? UNASSIGNED_VALUE}
        onValueChange={(val) => {
          if (val === UNASSIGNED_VALUE) {
            updateTask({ id: taskId, assignedTo: undefined });
          } else {
            const user = users?.find((u) => u._id === val);
            updateTask({ id: taskId, assignedTo: user?._id });
          }
        }}
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue>
            <div
              className={`flex items-center gap-1.5 ${!task?.assignedTo ? "text-muted-foreground" : ""}`}
            >
              <IconUserPlus size={14} className="text-muted-foreground" />
              <span>{task?.assignedTo ? assignedDisplayName : "Assignee"}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Assignee</SelectLabel>
            <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
            {(users ?? []).map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {getUserDisplayName(user)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div
        className="group/tags flex items-center min-h-[40px] rounded-md hover:bg-muted/50 transition-colors px-2 gap-1 flex-wrap cursor-text"
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
      </div>

      <Select
        value={task?.model ?? "sonnet"}
        onValueChange={(val) => {
          const model = CLAUDE_MODELS.find((m) => m === val);
          if (model) updateTask({ id: taskId, model });
        }}
        disabled={status !== "todo"}
      >
        <SelectTrigger className={GHOST_TRIGGER_CLASS}>
          <SelectValue>
            <div className="flex items-center gap-1.5">
              <IconBrain size={14} className="text-muted-foreground" />
              <span>{capitalize(task?.model ?? "sonnet")}</span>
              {status !== "todo" && (
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
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Model</SelectLabel>
            {CLAUDE_MODELS.map((m) => (
              <SelectItem key={m} value={m}>
                {capitalize(m)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {!task?.projectId && (
        <div className="flex items-center min-h-[40px] rounded-md hover:bg-muted/50 transition-colors px-2">
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
        <div className="flex items-center h-10 rounded-md hover:bg-muted/50 transition-colors px-2 gap-1.5 text-[13px]">
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
