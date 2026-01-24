"use client";

import { useState } from "react";
import { GenericId as Id } from "convex/values";
import { ProjectTaskListPanel } from "./ProjectTaskListPanel";
import { PlanContextPanel } from "./PlanContextPanel";

interface Project {
  _id: Id<"projects">;
  title: string;
  description?: string;
  branchName?: string;
  prUrl?: string;
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
  return (
    <div className="flex flex-1 min-h-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800/40">
      <div className="w-1/4 border-r dark:border-neutral-700 overflow-auto flex flex-col">
        <div className="flex-1 overflow-auto">
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
