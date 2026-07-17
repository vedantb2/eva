"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { entityPathSegment } from "@/lib/numId";
import { ProjectTaskListPanel } from "./ProjectTaskListPanel";
import { ProjectProgressBar } from "./ProjectProgressBar";
import { ProjectDescription } from "./ProjectDescription";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { IconChecklist } from "@tabler/icons-react";
import { QuickTaskModal } from "../quick-tasks/QuickTaskModal";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { ProjectPhase } from "./ProjectPhaseBadge";

interface Project {
  _id: Id<"projects">;
  numId?: number;
  title: string;
  description?: string;
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
  detailTab?: TaskDetailTab;
}

export function ProjectActiveLayout({
  projectId,
  project,
  basePath,
  selectedTaskId: selectedTaskIdParam,
  detailTab,
}: ProjectActiveLayoutProps) {
  const navigate = useNavigate();
  const cleanupTriggeredRef = useRef(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const projectPathSegment = entityPathSegment(project);

  const tasks = useQuery(api.agentTasks.listByProject, { projectId });
  const clearProjectSandbox = useMutation(api.projects.clearProjectSandbox);

  const selectedTaskId = useMemo<Id<"agentTasks"> | null>(() => {
    if (!selectedTaskIdParam || !tasks) return null;
    const match = tasks.find((t) => t._id === selectedTaskIdParam);
    return match?._id ?? null;
  }, [selectedTaskIdParam, tasks]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId || !tasks) return null;
    return tasks.find((t) => t._id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasks]);

  const handleSelectTask = useCallback(
    (id: Id<"agentTasks">) => {
      if (!projectPathSegment) return;
      const task = tasks?.find((t) => t._id === id);
      const taskPathSegment = task ? entityPathSegment(task) : null;
      if (!taskPathSegment) return;
      navigate({
        to: `${basePath}/projects/${projectPathSegment}/${taskPathSegment}/activity`,
      });
    },
    [navigate, basePath, projectPathSegment, tasks],
  );

  const handleCloseTask = useCallback(() => {
    if (!projectPathSegment) return;
    navigate({ to: `${basePath}/projects/${projectPathSegment}` });
  }, [navigate, basePath, projectPathSegment]);

  const activeDetailTab: TaskDetailTab = detailTab ?? "activity";

  const routing = useMemo(
    () =>
      selectedTaskId && selectedTask && projectPathSegment
        ? ({
            mode: "project-detail",
            project: {
              detailTab: activeDetailTab,
              onDetailTabChange: (tab: TaskDetailTab) => {
                const taskPathSegment = entityPathSegment(selectedTask);
                if (!taskPathSegment) return;
                navigate({
                  to: `${basePath}/projects/${projectPathSegment}/${taskPathSegment}/${tab}`,
                });
              },
            },
          } as const)
        : undefined,
    [
      activeDetailTab,
      basePath,
      navigate,
      projectPathSegment,
      selectedTask,
      selectedTaskId,
    ],
  );

  const allTags = useMemo(() => {
    if (!tasks) return [];
    const tagSet = new Set<string>();
    for (const t of tasks) {
      if (t.tags) {
        for (const tag of t.tags) tagSet.add(tag);
      }
    }
    return [...tagSet].sort();
  }, [tasks]);

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

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden bg-background">
      <div className="w-full md:w-1/3 lg:w-1/4 h-1/3 md:h-full flex flex-col overflow-hidden shrink-0">
        <ProjectDescription
          description={project.description}
          projectId={projectId}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          <ProjectTaskListPanel
            tasks={tasks ?? []}
            selectedTaskId={selectedTaskId}
            onSelectTask={handleSelectTask}
            onCreateTask={() => setCreateTaskOpen(true)}
          />
        </div>
        <ProjectProgressBar projectId={projectId} className="mx-3 mt-2 mb-3" />
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedTaskIdParam &&
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
      />
    </div>
  );
}
