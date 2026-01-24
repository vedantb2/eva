"use client";

import { useState } from "react";
import { GenericId as Id } from "convex/values";
import { ProjectTaskListPanel } from "./ProjectTaskListPanel";
import { PlanContextPanel } from "./PlanContextPanel";
import { Button } from "@heroui/button";
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react";

interface Project {
  _id: Id<"projects">;
  title: string;
  description?: string;
  branchName?: string;
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
  const [showPlanContext, setShowPlanContext] = useState(false);

  return (
    <div className="flex flex-1 min-h-0 border rounded-lg overflow-hidden dark:border-neutral-700 -m-5">
      <div className="w-1/4 border-r dark:border-neutral-700 overflow-auto flex flex-col">
        <div className="flex items-center justify-between p-2 border-b dark:border-neutral-700">
          <span className="text-sm font-medium">Tasks</span>
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={() => setShowPlanContext(!showPlanContext)}
          >
            {showPlanContext ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />}
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <ProjectTaskListPanel projectId={projectId} />
        </div>
        {showPlanContext && project.generatedSpec && (
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
