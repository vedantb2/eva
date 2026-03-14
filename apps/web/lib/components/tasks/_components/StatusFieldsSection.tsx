"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Doc, Id, FunctionReturnType } from "@conductor/backend";
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
  IconBrandVercel,
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
  const [tagsInput, setTagsInput] = useState("");
  const tagsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTagsInput((task?.tags ?? []).join(", "));
  }, [task?.tags]);

  const handleSaveTags = async () => {
    if (!task) return;
    const nextTags = Array.from(
      new Set(
        tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );
    const currentTags = task.tags ?? [];
    if (
      nextTags.length === currentTags.length &&
      nextTags.every((tag, i) => tag === currentTags[i])
    )
      return;
    await updateTask({ id: taskId, tags: nextTags });
  };

  const projectOptions = projects ?? [];
  const hasSelectedProject =
    task?.projectId !== undefined &&
    projectOptions.some((project) => project._id === task.projectId);
  const selectedProjectValue = task?.projectId ?? NO_PROJECT_VALUE;

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
            {selectedProjectValue !== NO_PROJECT_VALUE ? (
              <div className="flex items-center gap-1.5">
                <IconFolder size={14} className="text-muted-foreground" />
                <span>
                  {projectOptions.find((p) => p._id === selectedProjectValue)
                    ?.title ?? "Project"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <IconFolder size={14} />
                <span>Project</span>
              </div>
            )}
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
            {task?.assignedTo ? (
              <div className="flex items-center gap-1.5">
                <IconUserPlus size={14} className="text-muted-foreground" />
                <span>
                  {(() => {
                    const user = users?.find((u) => u._id === task?.assignedTo);
                    return user ? getUserDisplayName(user) : "Unnamed User";
                  })()}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <IconUserPlus size={14} />
                <span>Assignee</span>
              </div>
            )}
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
        onClick={() => tagsInputRef.current?.focus()}
      >
        <IconTags size={14} className="text-muted-foreground shrink-0" />
        {task?.tags?.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs h-5">
            {tag}
          </Badge>
        ))}
        {(task?.tags?.length ?? 0) === 0 && (
          <span className="text-[13px] text-muted-foreground group-focus-within/tags:hidden">
            Tags
          </span>
        )}
        <Input
          ref={tagsInputRef}
          value={tagsInput}
          placeholder="Add tag..."
          className="h-7 border-0 shadow-none bg-transparent px-0 focus-visible:ring-0 text-[13px] min-w-16 flex-1 placeholder:text-muted-foreground hidden group-focus-within/tags:block"
          onChange={(e) => setTagsInput(e.target.value)}
          onBlur={() => {
            void handleSaveTags();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSaveTags();
            }
          }}
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
        <div className="flex items-center min-h-[28px] rounded-md hover:bg-muted/50 transition-colors px-2">
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
        <div className="flex items-center h-7 rounded-md hover:bg-muted/50 transition-colors px-2 gap-1.5 text-[13px]">
          <IconBrandVercel size={14} className="text-muted-foreground" />
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              DEPLOYMENT_STATUS_CONFIG[latestDeployment.deploymentStatus]
                ?.color ?? "bg-gray-500"
            }`}
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
