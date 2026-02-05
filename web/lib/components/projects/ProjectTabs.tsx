"use client";

import { useState, useCallback } from "react";
import { GenericId as Id } from "convex/values";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { ProjectChatTab, type ConversationMessage } from "./ProjectChatTab";
import { ProjectPlanTab } from "./ProjectPlanTab";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";

interface ProjectTabsProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  rawInput: string;
  generatedSpec: string | undefined;
  conversationHistory: ConversationMessage[];
  streamingActivity?: string;
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
  streamingActivity,
  repoSlug,
  repoId,
  installationId,
}: ProjectTabsProps) {
  const [pendingSpec, setPendingSpec] = useState<string | null>(null);
  const updateProject = useMutation(api.projects.update);
  const clearMessagesDb = useMutation(api.projects.clearMessages);
  const addMessageDb = useMutation(api.projects.addMessage);

  const handleSpecGenerated = useCallback((spec: string) => {
    setPendingSpec(spec);
  }, []);

  const handleClear = useCallback(async () => {
    await clearMessagesDb({ id: projectId });
    await updateProject({ id: projectId, phase: "draft" });
    setPendingSpec(null);
  }, [clearMessagesDb, updateProject, projectId]);

  const answersFromHistory: Array<{ question: string; answer: string }> = [];
  for (let i = 0; i < conversationHistory.length - 1; i++) {
    const msg = conversationHistory[i];
    const nextMsg = conversationHistory[i + 1];
    if (msg.role === "assistant" && nextMsg?.role === "user") {
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed.question) {
          answersFromHistory.push({
            question: parsed.question,
            answer: nextMsg.content,
          });
        }
      } catch {
        continue;
      }
    }
  }

  const handleRejectSpec = useCallback(
    async (reason: string) => {
      await updateProject({ id: projectId, phase: "draft" });
      await addMessageDb({ id: projectId, role: "user", content: reason });

      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "project/interview.question",
          data: {
            projectId,
            repoId,
            installationId,
            featureDescription: rawInput,
            previousAnswers: answersFromHistory,
            rejectionReason: reason,
          },
        }),
      });

      setPendingSpec(null);
    },
    [
      projectId,
      repoId,
      installationId,
      rawInput,
      updateProject,
      addMessageDb,
      answersFromHistory,
    ],
  );

  const specToShow =
    projectPhase !== "draft" ? (pendingSpec ?? generatedSpec) : undefined;

  if (!specToShow) {
    return (
      <ProjectChatTab
        projectId={projectId}
        projectPhase={projectPhase}
        initialMessages={conversationHistory}
        streamingActivity={streamingActivity}
        rawInput={rawInput}
        onSpecGenerated={handleSpecGenerated}
        onClear={handleClear}
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
          onClear={handleClear}
          repoId={repoId}
          installationId={installationId}
        />
      </div>
      <div className="overflow-y-auto scrollbar">
        <ProjectPlanTab
          projectId={projectId}
          projectPhase={projectPhase}
          generatedSpec={specToShow}
          repoSlug={repoSlug}
          repoId={repoId}
          installationId={installationId}
          onRejectSpec={handleRejectSpec}
        />
      </div>
    </div>
  );
}
