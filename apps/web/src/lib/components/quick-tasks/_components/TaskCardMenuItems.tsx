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
} from "@conductor/ui";
import type { Id } from "@conductor/backend";
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

type SiblingApp = { _id: Id<"githubRepos">; appName: string };
type User = FunctionReturnType<typeof api.users.listAll>[number];
type Project = FunctionReturnType<typeof api.projects.list>[number];

const MODEL_OPTIONS = [
  { value: "opus", label: "Opus" },
  { value: "sonnet", label: "Sonnet" },
  { value: "haiku", label: "Haiku" },
] as const;

export interface TaskCardMenuItemsProps {
  variant: "context" | "dropdown";
  id: Id<"agentTasks">;
  title: string;
  status: TaskStatus;
  assignedTo?: Id<"users">;
  model?: string;
  projectId?: Id<"projects">;
  siblingApps?: SiblingApp[];
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
  siblingApps,
  users,
  currentUserId,
  projects,
  onDelete,
  onMove,
}: TaskCardMenuItemsProps) {
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const updateTask = useMutation(api.agentTasks.update);
  const startExecution = useMutation(api.agentTasks.startExecution);

  const canRun = status === "todo";
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
          <RadioGroup
            value={model ?? "sonnet"}
            onValueChange={(value) => {
              const matched = MODEL_OPTIONS.find((m) => m.value === value);
              if (!matched) return;
              updateTask({ id, model: matched.value });
            }}
          >
            {MODEL_OPTIONS.map((m) => (
              <RadioItem key={m.value} value={m.value}>
                {m.label}
              </RadioItem>
            ))}
          </RadioGroup>
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

      {siblingApps && siblingApps.length > 0 && (
        <>
          <Sub>
            <SubTrigger>
              <IconArrowMoveRight size={16} />
              Move to app
            </SubTrigger>
            <SubContent>
              {siblingApps.map((app) => (
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
        onSelect={(e) => {
          e.preventDefault();
          onDelete();
        }}
      >
        <IconTrash size={16} />
        Delete
      </Item>
    </>
  );
}
