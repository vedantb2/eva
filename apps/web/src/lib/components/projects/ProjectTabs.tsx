"use client";

import { useState } from "react";
import type { Id } from "@eva/backend";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { ProjectChatTab, type ConversationMessage } from "./ProjectChatTab";
import { ProjectPlanTab } from "./ProjectPlanTab";
import { useUpdateProject } from "./useUpdateProject";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";

interface ProjectTabsProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  activeWorkflowId?: string;
  rawInput: string;
  generatedSpec: string | undefined;
  conversationHistory: ConversationMessage[];
  streamingActivity?: string;
  sandboxStartupActivity?: string;
  basePath: string;
  repoId: Id<"githubRepos">;
}

export function ProjectTabs({
  projectId,
  projectPhase,
  activeWorkflowId,
  rawInput,
  generatedSpec,
  conversationHistory,
  streamingActivity,
  sandboxStartupActivity,
  basePath,
  repoId,
}: ProjectTabsProps) {
  const [pendingSpec, setPendingSpec] = useState<string | null>(null);
  const updateProject = useUpdateProject(projectId);
  const clearMessagesDb = useMutation(api.projects.clearMessages);
  const addMessageDb = useMutation(api.projects.addMessage);
  const startProjectInterview = useMutation(
    api.projectInterviewWorkflow.startInterview,
  );

  const handleSpecGenerated = (spec: string) => {
    setPendingSpec(spec);
  };

  const handleClear = async () => {
    await clearMessagesDb({ id: projectId });
    await updateProject({ id: projectId, phase: "draft" });
    setPendingSpec(null);
  };

  const handleRejectSpec = async (reason: string) => {
    await updateProject({ id: projectId, phase: "draft" });
    await addMessageDb({ id: projectId, role: "user", content: reason });

    await startProjectInterview({
      projectId,
      featureDescription: rawInput,
      previousAnswers: [], // Session persistence provides context
      rejectionReason: reason,
    });

    setPendingSpec(null);
  };

  const specToShow =
    projectPhase !== "draft" ? (pendingSpec ?? generatedSpec) : undefined;

  if (!specToShow) {
    return (
      <ProjectChatTab
        projectId={projectId}
        projectPhase={projectPhase}
        activeWorkflowId={activeWorkflowId}
        initialMessages={conversationHistory}
        streamingActivity={streamingActivity ?? sandboxStartupActivity}
        rawInput={rawInput}
        onSpecGenerated={handleSpecGenerated}
        onClear={handleClear}
        repoId={repoId}
      />
    );
  }

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2">
      <div className="overflow-y-auto scrollbar min-h-0">
        <ProjectChatTab
          projectId={projectId}
          projectPhase={projectPhase}
          activeWorkflowId={activeWorkflowId}
          initialMessages={conversationHistory}
          streamingActivity={streamingActivity ?? sandboxStartupActivity}
          rawInput={rawInput}
          onSpecGenerated={handleSpecGenerated}
          onClear={handleClear}
          repoId={repoId}
        />
      </div>
      <div className="overflow-y-auto scrollbar min-h-0">
        <ProjectPlanTab
          projectId={projectId}
          projectPhase={projectPhase}
          generatedSpec={specToShow}
          basePath={basePath}
          repoId={repoId}
          onRejectSpec={handleRejectSpec}
        />
      </div>
    </div>
  );
}
