"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Doc, Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@eva/ui";
import { IconFolder, IconFolderPlus } from "@tabler/icons-react";
import type { TaskStatus } from "../TaskStatusBadge";
import {
  GHOST_TRIGGER_CLASS,
  NEW_PROJECT_VALUE,
  NO_PROJECT_VALUE,
} from "./task-detail-constants";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";
import { PropertyRow } from "./PropertyRow";
import { TaskLabelsField } from "./TaskLabelsField";
import { TaskPropertySelects } from "./TaskPropertySelects";

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

/**
 * Task detail properties rail. One "Properties" heading over label/value rows —
 * status, priority, code reviewer, base branch, deployment, project, labels —
 * rather than the three titled groups of unlabelled full-width selects this
 * used to be. Owns the two mutations; the rows themselves are dumb.
 */
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
  hasActiveRun: _hasActiveRun,
  allTags,
  requestingChanges: _requestingChanges,
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
        runAuditEnabled,
        providerAccountId,
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
        ...(runAuditEnabled !== undefined
          ? { runAuditEnabled: runAuditEnabled ?? undefined }
          : {}),
        ...(providerAccountId !== undefined
          ? { providerAccountId: providerAccountId ?? undefined }
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
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value || !task) return;
    const current = task.tags ?? [];
    if (current.includes(value)) return;
    void updateTask({ id: taskId, tags: [...current, value] });
  };

  const removeTag = (tag: string) => {
    if (!task) return;
    const next = (task.tags ?? []).filter((t) => t !== tag);
    void updateTask({ id: taskId, tags: next });
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
      : "No project";

  return (
    <div className="space-y-0.5">
      <p className="pb-1.5 text-xs font-medium text-foreground">Properties</p>

      <TaskPropertySelects
        task={task}
        status={status}
        isBlocked={isBlocked}
        users={users}
        baseBranch={baseBranch}
        latestDeployment={latestDeployment}
        onStatusChange={(next) => updateStatus({ id: taskId, status: next })}
        onPriorityChange={(priority) => updateTask({ id: taskId, priority })}
        onAssigneeChange={(assignedTo) =>
          updateTask({ id: taskId, assignedTo })
        }
        onBaseBranchChange={(branch) => {
          setBaseBranch(branch);
          updateTask({ id: taskId, baseBranch: branch });
        }}
      />

      <PropertyRow label="Project">
        <Select
          value={selectedProjectValue}
          onValueChange={(val) => {
            if (val === NEW_PROJECT_VALUE) {
              setIsCreatingProject(true);
              return;
            }
            if (val === NO_PROJECT_VALUE) {
              updateTask({ id: taskId, projectId: null });
              return;
            }
            const project = projectOptions.find((p) => p._id === val);
            if (project) {
              updateTask({ id: taskId, projectId: project._id });
            }
          }}
        >
          <SelectTrigger className={GHOST_TRIGGER_CLASS}>
            <SelectValue placeholder="Project">
              <div
                className={`flex items-center gap-1.5 ${selectedProjectValue === NO_PROJECT_VALUE ? "text-muted-foreground" : ""}`}
              >
                <IconFolder size={14} className="text-muted-foreground" />
                <span className="truncate">{selectedProjectTitle}</span>
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
      </PropertyRow>

      <PropertyRow label="Labels" align="start">
        <TaskLabelsField
          tags={task?.tags ?? []}
          allTags={allTags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
      </PropertyRow>

      <NewProjectModal
        isOpen={isCreatingProject}
        onClose={() => setIsCreatingProject(false)}
        onCreated={(id) => updateTask({ id: taskId, projectId: id })}
        defaultSkipPlanning
      />
    </div>
  );
}
