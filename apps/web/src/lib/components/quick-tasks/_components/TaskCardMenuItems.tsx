"use client";

import {
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  ContextMenuLabel,
  DropdownMenuLabel,
} from "@conductor/ui";
import {
  AI_MODEL_OPTIONS,
  getAIModelProvider,
  normalizeAIModel,
  type Id,
} from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import {
  IconArrowMoveRight,
  IconBrain,
  IconClipboard,
  IconFolder,
  IconLink,
  IconPlayerPlay,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import {
  statusConfig,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";

type GroupedCodebase = FunctionReturnType<
  typeof api.githubRepos.listGroupedByCodebase
>[number];
type User = FunctionReturnType<typeof api.users.listAll>[number];
type Project = FunctionReturnType<typeof api.projects.list>[number];

export interface TaskCardMenuItemsProps {
  variant: "context" | "dropdown";
  id: Id<"agentTasks">;
  title: string;
  status: TaskStatus;
  assignedTo?: Id<"users">;
  model?: string;
  projectId?: Id<"projects">;
  repoId?: Id<"githubRepos">;
  groupedCodebases?: GroupedCodebase[];
  users?: User[];
  currentUserId?: Id<"users">;
  projects?: Project[];
  onDelete: () => void;
  onMove: (targetId: Id<"githubRepos">) => void;
}

export function TaskCardMenuItems({
  variant,
  id,
  title,
  status,
  assignedTo,
  model,
  projectId,
  repoId,
  groupedCodebases,
  users,
  currentUserId,
  projects,
  onDelete,
  onMove,
}: TaskCardMenuItemsProps) {
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const updateTask = useMutation(api.agentTasks.update);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const normalizedModel = normalizeAIModel(model);
  const { options: modelOptions } = useAvailableAiModels(
    repoId,
    normalizedModel,
  );

  const canRun = status === "todo" || status === "in_progress";
  const StatusIcon = statusConfig[status].icon;

  const Item = variant === "context" ? ContextMenuItem : DropdownMenuItem;
  const Sub = variant === "context" ? ContextMenuSub : DropdownMenuSub;
  const SubTrigger =
    variant === "context" ? ContextMenuSubTrigger : DropdownMenuSubTrigger;
  const SubContent =
    variant === "context" ? ContextMenuSubContent : DropdownMenuSubContent;
  const RadioGroup =
    variant === "context" ? ContextMenuRadioGroup : DropdownMenuRadioGroup;
  const RadioItem =
    variant === "context" ? ContextMenuRadioItem : DropdownMenuRadioItem;
  const MenuSeparator =
    variant === "context" ? ContextMenuSeparator : DropdownMenuSeparator;
  const MenuLabel =
    variant === "context" ? ContextMenuLabel : DropdownMenuLabel;

  // Filter out the current repo from move targets
  const moveTargets = groupedCodebases?.filter((codebase) =>
    codebase.apps.some((app) => app._id !== repoId),
  );
  const hasMoveTargets = moveTargets && moveTargets.length > 0;

  return (
    <>
      <Item
        disabled={!canRun}
        onSelect={() => {
          void startExecution({ id });
        }}
      >
        <IconPlayerPlay size={16} />
        Run Eva
      </Item>
      <MenuSeparator />

      <Sub>
        <SubTrigger>
          <StatusIcon size={16} />
          Status
        </SubTrigger>
        <SubContent>
          <RadioGroup
            value={status}
            onValueChange={(value) => {
              const matched = TASK_STATUSES.find((s) => s === value);
              if (!matched) return;
              updateStatus({ id, status: matched });
            }}
          >
            {TASK_STATUSES.map((s) => {
              const cfg = statusConfig[s];
              const Icon = cfg.icon;
              return (
                <RadioItem key={s} value={s}>
                  <Icon size={16} className={cfg.text} />
                  {cfg.label}
                </RadioItem>
              );
            })}
          </RadioGroup>
        </SubContent>
      </Sub>

      <Sub>
        <SubTrigger>
          <IconUserPlus size={16} />
          Assignee
        </SubTrigger>
        <SubContent>
          <RadioGroup
            value={assignedTo ?? "unassigned"}
            onValueChange={(value) => {
              if (value === "unassigned") {
                updateTask({ id, assignedTo: null });
              } else {
                const matchedUser = (users ?? []).find((u) => u._id === value);
                const userId =
                  currentUserId === value ? currentUserId : matchedUser?._id;
                if (!userId) return;
                updateTask({ id, assignedTo: userId });
              }
            }}
          >
            {currentUserId && (
              <RadioItem value={currentUserId}>Assign to me</RadioItem>
            )}
            <MenuSeparator />
            <RadioItem value="unassigned">Unassigned</RadioItem>
            {users?.map((user) => (
              <RadioItem key={user._id} value={user._id}>
                {user.fullName ?? user.firstName ?? "Unknown"}
              </RadioItem>
            ))}
          </RadioGroup>
        </SubContent>
      </Sub>

      <Sub>
        <SubTrigger disabled={status !== "todo"}>
          <IconBrain size={16} />
          Model
        </SubTrigger>
        <SubContent>
          {(() => {
            const opts =
              modelOptions.length > 0 ? modelOptions : AI_MODEL_OPTIONS;
            const providers = [
              ...new Set(opts.map((o) => getAIModelProvider(o.id))),
            ];
            if (providers.length === 1) {
              return (
                <RadioGroup
                  value={normalizedModel}
                  onValueChange={(value) => {
                    const matched = opts.find((o) => o.id === value);
                    if (matched) updateTask({ id, model: matched.id });
                  }}
                >
                  {opts.map((option) => (
                    <RadioItem key={option.id} value={option.id}>
                      {option.label}
                    </RadioItem>
                  ))}
                </RadioGroup>
              );
            }
            return providers.map((provider) => (
              <Sub key={provider}>
                <SubTrigger>
                  {provider === "codex" ? "Codex" : "Claude"}
                </SubTrigger>
                <SubContent>
                  <RadioGroup
                    value={normalizedModel}
                    onValueChange={(value) => {
                      const matched = opts.find((o) => o.id === value);
                      if (matched) updateTask({ id, model: matched.id });
                    }}
                  >
                    {opts
                      .filter((o) => getAIModelProvider(o.id) === provider)
                      .map((option) => (
                        <RadioItem key={option.id} value={option.id}>
                          {option.label}
                        </RadioItem>
                      ))}
                  </RadioGroup>
                </SubContent>
              </Sub>
            ));
          })()}
        </SubContent>
      </Sub>

      <Sub>
        <SubTrigger>
          <IconFolder size={16} />
          Project
        </SubTrigger>
        <SubContent>
          <RadioGroup
            value={projectId ?? "none"}
            onValueChange={(value) => {
              if (value === "none") {
                updateTask({ id, projectId: null });
              } else {
                const matched = (projects ?? []).find((p) => p._id === value);
                if (!matched) return;
                updateTask({ id, projectId: matched._id });
              }
            }}
          >
            <RadioItem value="none">No project</RadioItem>
            {projects?.map((project) => (
              <RadioItem key={project._id} value={project._id}>
                {project.title}
              </RadioItem>
            ))}
          </RadioGroup>
        </SubContent>
      </Sub>

      <MenuSeparator />

      {hasMoveTargets && (
        <>
          <Sub>
            <SubTrigger>
              <IconArrowMoveRight size={16} />
              Move to codebase
            </SubTrigger>
            <SubContent className="max-h-80 overflow-y-auto">
              {moveTargets.map((codebase) => {
                // Filter out current repo from apps
                const availableApps = codebase.apps.filter(
                  (app) => app._id !== repoId,
                );
                if (availableApps.length === 0) return null;

                // Single app codebase: show directly
                if (!codebase.isMonorepo || availableApps.length === 1) {
                  const app = availableApps[0];
                  return (
                    <Item
                      key={app._id}
                      onSelect={() => {
                        onMove(app._id);
                      }}
                    >
                      {codebase.displayName}
                    </Item>
                  );
                }

                // Monorepo: show as submenu with apps grouped
                return (
                  <Sub key={codebase.codebase}>
                    <SubTrigger>{codebase.displayName}</SubTrigger>
                    <SubContent>
                      <MenuLabel className="text-xs text-muted-foreground">
                        Apps
                      </MenuLabel>
                      {availableApps.map((app) => (
                        <Item
                          key={app._id}
                          onSelect={(e) => {
                            e.preventDefault();
                            onMove(app._id);
                          }}
                        >
                          {app.appName}
                        </Item>
                      ))}
                    </SubContent>
                  </Sub>
                );
              })}
            </SubContent>
          </Sub>
          <MenuSeparator />
        </>
      )}

      <Item
        onSelect={() => {
          navigator.clipboard.writeText(title);
        }}
      >
        <IconClipboard size={16} />
        Copy title
      </Item>
      <Item
        onSelect={() => {
          navigator.clipboard.writeText(
            window.location.origin + window.location.pathname,
          );
        }}
      >
        <IconLink size={16} />
        Copy task link
      </Item>

      <MenuSeparator />

      <Item
        className="text-destructive focus:text-destructive"
        onSelect={() => {
          onDelete();
        }}
      >
        <IconTrash size={16} />
        Delete
      </Item>
    </>
  );
}
