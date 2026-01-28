"use client";

import { useEffect, useRef } from "react";
import { GenericId as Id } from "convex/values";
import { ProjectTaskListPanel } from "./ProjectTaskListPanel";
import { PlanContextPanel } from "./PlanContextPanel";

interface Project {
  _id: Id<"projects">;
  title: string;
  description?: string;
  branchName?: string;
  prUrl?: string;
  sandboxId?: string;
  phase: "draft" | "finalized" | "active" | "completed";
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
  repoSlug: string;
}

export function ProjectActiveLayout({
  projectId,
  project,
  repoSlug,
}: ProjectActiveLayoutProps) {
  const cleanupTriggeredRef = useRef(false);

  useEffect(() => {
    if (project.phase === "completed" && project.sandboxId && !cleanupTriggeredRef.current) {
      cleanupTriggeredRef.current = true;
      fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "project/sandbox.cleanup",
          data: { projectId: project._id, sandboxId: project.sandboxId },
        }),
      }).catch(() => {});
    }
  }, [project.phase, project.sandboxId, project._id]);
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-white dark:bg-neutral-800/40">
      <div className="w-1/4 h-full border-r dark:border-neutral-700 flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <ProjectTaskListPanel projectId={projectId} />
        </div>
        {project.generatedSpec && (
          <div className="border-t dark:border-neutral-700">
            <PlanContextPanel
              generatedSpec={project.generatedSpec}
              conversationHistory={project.conversationHistory}
            />
          </div>
        )}
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <p className="text-neutral-400">Sandbox (coming soon)</p>
      </div>
      <div className="w-1/4 border-l dark:border-neutral-700 flex items-center justify-center">
        <p className="text-neutral-400">Chat (coming soon)</p>
      </div>
    </div>
  );
}
