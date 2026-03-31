"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ProjectTaskListPanel } from "./ProjectTaskListPanel";
import { ProjectProgressBar } from "./ProjectProgressBar";
import { PlanContextPanel } from "./PlanContextPanel";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { IconChecklist } from "@tabler/icons-react";
import { QuickTaskModal } from "../quick-tasks/QuickTaskModal";

interface Project {
  _id: Id<"projects">;
  title: string;
  description?: string;
  branchName?: string;
  sandboxId?: string;
  phase: "draft" | "finalized" | "active" | "completed" | "cancelled";
  rawInput: string;
  generatedSpec?: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface ProjectActiveLayoutProps {
  projectId: Id<"projects">;
  project: Project;
  basePath: string;
  generatedSpec?: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export function ProjectActiveLayout({
  projectId,
  project,
  basePath,
  generatedSpec,
  conversationHistory,
}: ProjectActiveLayoutProps) {
  const cleanupTriggeredRef = useRef(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"agentTasks"> | null>(
    null,
  );

  const tasks = useQuery(api.agentTasks.listByProject, { projectId });
  const clearProjectSandbox = useMutation(api.projects.clearProjectSandbox);

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
        <div className="flex-1 min-h-0 overflow-hidden">
          <ProjectTaskListPanel
            tasks={tasks ?? []}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            onCreateTask={() => setCreateTaskOpen(true)}
          />
        </div>
        {generatedSpec && (
          <div className="pt-6 p-2 flex justify-center gap-2">
            <PlanContextPanel
              generatedSpec={generatedSpec}
              conversationHistory={conversationHistory}
            />
          </div>
        )}
        <ProjectProgressBar projectId={projectId} className="mx-3 mt-2 mb-3" />
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedTaskId ? (
          <TaskDetailInline
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
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
