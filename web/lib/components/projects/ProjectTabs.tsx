"use client";

import { useState, useCallback } from "react";
import { GenericId as Id } from "convex/values";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { ProjectChatTab } from "./ProjectChatTab";
import { ProjectPlanTab } from "./ProjectPlanTab";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

type ProjectPhase = "draft" | "finalized" | "active" | "completed";
type IndexingStatus = "pending" | "indexing" | "complete" | "error" | undefined;

interface ProjectTabsProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  rawInput: string;
  generatedSpec: string | undefined;
  codebaseIndex: string | undefined;
  indexingStatus: IndexingStatus;
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
  codebaseIndex,
  indexingStatus,
  conversationHistory,
  repoSlug,
  repoId,
  installationId,
}: ProjectTabsProps) {
  const [pendingSpec, setPendingSpec] = useState<string | null>(null);
  const [isInterview, setIsInterview] = useState(false);
  const updateProject = useMutation(api.projects.update);

  const handleSpecGenerated = useCallback(
    async (spec: string) => {
      setPendingSpec(spec);
      await updateProject({ id: projectId, generatedSpec: spec, phase: "finalized" });
    },
    [projectId, updateProject]
  );

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
          codebaseIndex={codebaseIndex}
          indexingStatus={indexingStatus}
          onSpecGenerated={handleSpecGenerated}
          isInterview={isInterview}
          repoId={repoId}
          installationId={installationId}
        />
    );
  }

  return (
    <div className="h-full grid grid-cols-2">
      <div className="border-r border-divider overflow-y-auto">
        <ProjectChatTab
          projectId={projectId}
          projectPhase={projectPhase}
          initialMessages={conversationHistory}
          rawInput={rawInput}
          codebaseIndex={codebaseIndex}
          indexingStatus={indexingStatus}
          onSpecGenerated={handleSpecGenerated}
          isInterview={isInterview}
          repoId={repoId}
          installationId={installationId}
        />
      </div>
      <div className="overflow-y-auto">
        <ProjectPlanTab
          projectId={projectId}
          projectPhase={projectPhase}
          generatedSpec={hasSpec}
          codebaseIndex={codebaseIndex}
          indexingStatus={indexingStatus}
          repoSlug={repoSlug}
          repoId={repoId}
          installationId={installationId}
          onStartInterview={handleStartInterview}
        />
      </div>
    </div>
  );
}
