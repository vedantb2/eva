"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { cn, Spinner } from "@eva/ui";
import { entityPathSegment } from "@/lib/numId";
import { MobilePaneSwitcher } from "@/lib/components/MobilePaneSwitcher";
import { ProjectTaskListPanel } from "./ProjectTaskListPanel";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { IconChecklist } from "@tabler/icons-react";
import { QuickTaskModal } from "../quick-tasks/QuickTaskModal";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { ProjectPhase } from "./ProjectPhaseBadge";
import type { EntityResolveStatus } from "@/lib/components/EntityNumIdGate";
import { useRepo } from "@/lib/contexts/RepoContext";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";
import { TASK_TAGS } from "@eva/shared";

interface Project {
  _id: Id<"projects">;
  numId?: number;
  title: string;
  branchName?: string;
  sandboxId?: string;
  phase: ProjectPhase;
  rawInput: string;
}

interface ProjectActiveLayoutProps {
  projectId: Id<"projects">;
  project: Project;
  basePath: string;
  selectedTaskId?: Id<"agentTasks">;
  /** Resolve status of selectedTaskId's numId; undefined when no task is selected. */
  selectedTaskStatus?: EntityResolveStatus;
  detailTab?: TaskDetailTab;
}

export function ProjectActiveLayout({
  projectId,
  project,
  basePath,
  selectedTaskId: selectedTaskIdParam,
  selectedTaskStatus,
  detailTab,
}: ProjectActiveLayoutProps) {
  const navigate = useNavigate();
  const { repo } = useRepo();
  const cleanupTriggeredRef = useRef(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const projectPathSegment = entityPathSegment(project);

  const tasks = useQuery(api.agentTasks.listByProject, { projectId });
  const users = useQuery(api.users.listAll);
  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const clearProjectSandbox = useMutation(api.projects.clearProjectSandbox);

  let selectedTaskId: Id<"agentTasks"> | null = null;
  if (selectedTaskIdParam && tasks) {
    const match = tasks.find((t) => t._id === selectedTaskIdParam);
    selectedTaskId = match?._id ?? null;
  }

  const selectedTask =
    selectedTaskId && tasks
      ? (tasks.find((t) => t._id === selectedTaskId) ?? null)
      : null;

  const handleSelectTask = (id: Id<"agentTasks">) => {
    if (!projectPathSegment) return;
    const task = tasks?.find((t) => t._id === id);
    const taskPathSegment = task ? entityPathSegment(task) : null;
    if (!taskPathSegment) return;
    navigate({
      to: toInternalRepoHref(
        `${basePath}/projects/${projectPathSegment}/${taskPathSegment}/activity`,
      ),
    });
  };

  const handleCloseTask = () => {
    if (!projectPathSegment) return;
    navigate({
      to: toInternalRepoHref(`${basePath}/projects/${projectPathSegment}`),
    });
  };

  const activeDetailTab: TaskDetailTab = detailTab ?? "activity";

  const routing =
    selectedTaskId && selectedTask && projectPathSegment
      ? ({
          mode: "project-detail",
          project: {
            detailTab: activeDetailTab,
            onDetailTabChange: (tab: TaskDetailTab) => {
              const taskPathSegment = entityPathSegment(selectedTask);
              if (!taskPathSegment) return;
              navigate({
                to: toInternalRepoHref(
                  `${basePath}/projects/${projectPathSegment}/${taskPathSegment}/${tab}`,
                ),
              });
            },
          },
        } as const)
      : undefined;

  const tagSet = new Set<string>(TASK_TAGS);
  if (tasks) {
    for (const t of tasks) {
      if (t.tags) {
        for (const tag of t.tags) tagSet.add(tag);
      }
    }
  }
  const allTags = [...tagSet].sort();

  useEffect(() => {
    if (
      (project.phase === "completed" || project.phase === "cancelled") &&
      project.sandboxId &&
      !cleanupTriggeredRef.current
    ) {
      cleanupTriggeredRef.current = true;
      clearProjectSandbox({ id: project._id }).catch(() => {});
    }
  }, [project.phase, project.sandboxId, project._id, clearProjectSandbox]);

  // Below `md` the list and the detail cannot share the viewport — a 1/3 + 2/3
  // vertical split gives two independently scrolling panes of ~230px and ~470px,
  // and neither is usable. So one pane is on screen at a time, and *which* one is
  // the URL: a selected task means the detail. The switcher's list button clears
  // the selection, so there is no second source of truth to keep in sync, and it
  // is only rendered when there are two panes to move between.
  const detailRequested =
    selectedTaskIdParam !== undefined || selectedTaskStatus !== undefined;

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-background md:flex-row">
      {detailRequested ? (
        <div className="shrink-0 md:hidden">
          <MobilePaneSwitcher
            labels={{ left: "Tasks", right: "Details" }}
            showingRight
            onSelect={(pane) => {
              if (pane === "left") handleCloseTask();
            }}
          />
        </div>
      ) : null}
      <div
        className={cn(
          // `md:flex-none` keeps the desktop column at its width: a `flex-1`
          // basis of 0 would otherwise let it grow past `w-1/3` in the row.
          "flex min-h-0 flex-col overflow-hidden md:h-full md:w-1/3 md:flex-none md:shrink-0 lg:w-1/4",
          detailRequested ? "hidden md:flex" : "flex-1",
        )}
      >
        <ProjectTaskListPanel
          tasks={tasks ?? []}
          selectedTaskId={selectedTaskId}
          onSelectTask={handleSelectTask}
          onCreateTask={() => setCreateTaskOpen(true)}
          projectNumId={project.numId}
        />
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 flex-col overflow-hidden md:flex",
          detailRequested ? "flex" : "hidden",
        )}
      >
        {selectedTaskStatus === "loading" ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : selectedTaskStatus === "not-found" ? (
          <EntityNotFound
            entityLabel="task"
            backTo={
              projectPathSegment
                ? `${basePath}/projects/${projectPathSegment}`
                : `${basePath}/projects`
            }
            backLabel="Back to project"
          />
        ) : selectedTaskIdParam &&
          tasks !== undefined &&
          selectedTaskId === null ? (
          <EntityNotFound
            entityLabel="task"
            backTo={
              projectPathSegment
                ? `${basePath}/projects/${projectPathSegment}`
                : `${basePath}/projects`
            }
            backLabel="Back to project"
          />
        ) : selectedTaskId ? (
          <TaskDetailInline
            key={selectedTaskId}
            taskId={selectedTaskId}
            onClose={handleCloseTask}
            allTags={allTags}
            routing={routing}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-4">
            <IconChecklist size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a task to view details
            </p>
          </div>
        )}
      </div>
      <QuickTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={projectId}
        users={users ?? undefined}
        projects={projects ?? undefined}
        allTags={allTags}
      />
    </div>
  );
}
