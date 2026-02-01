"use client";

import { useState, useCallback } from "react";
import { GenericId as Id } from "convex/values";
import { ProjectChatTab } from "./ProjectChatTab";
import { ProjectPlanTab } from "./ProjectPlanTab";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

type ProjectPhase = "draft" | "finalized" | "active" | "completed";

interface ProjectTabsProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  rawInput: string;
  generatedSpec: string | undefined;
  conversationHistory: ConversationMessage[];
  repoSlug: string;
  repoId: Id<"githubRepos">;
  installationId: number;
}

export function ProjectTabs({
  projectId,
  projectPhase,
  rawInput,
  generatedSpec,
  conversationHistory,
  repoSlug,
  repoId,
  installationId,
}: ProjectTabsProps) {
  const [pendingSpec, setPendingSpec] = useState<string | null>(null);
  const [isInterview, setIsInterview] = useState(false);

  const handleSpecGenerated = useCallback((spec: string) => {
    setPendingSpec(spec);
  }, []);

  const handleStartInterview = useCallback(() => {
    setIsInterview(true);
  }, []);

  const hasSpec = pendingSpec || generatedSpec;

  if (!hasSpec) {
    return (
        <ProjectChatTab
          projectId={projectId}
          projectPhase={projectPhase}
          initialMessages={conversationHistory}
          rawInput={rawInput}
          onSpecGenerated={handleSpecGenerated}
          isInterview={isInterview}
          repoId={repoId}
          installationId={installationId}
        />
    );
  }

  return (
    <div className="h-full grid grid-cols-2">
      <div className="border-r border-divider overflow-y-auto scrollbar">
        <ProjectChatTab
          projectId={projectId}
          projectPhase={projectPhase}
          initialMessages={conversationHistory}
          rawInput={rawInput}
          onSpecGenerated={handleSpecGenerated}
          isInterview={isInterview}
          repoId={repoId}
          installationId={installationId}
        />
      </div>
      <div className="overflow-y-auto scrollbar">
        <ProjectPlanTab
          projectId={projectId}
          projectPhase={projectPhase}
          generatedSpec={hasSpec}
          repoSlug={repoSlug}
          repoId={repoId}
          installationId={installationId}
          onStartInterview={handleStartInterview}
        />
      </div>
    </div>
  );
}
