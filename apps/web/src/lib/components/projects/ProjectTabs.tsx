import type { Id } from "@eva/backend";
import { api } from "@eva/backend";
import { useMutation } from "convex/react";
import { ProjectChatTab } from "./ProjectChatTab";
import { ProjectPlanTab } from "./ProjectPlanTab";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";
import type { ProjectConversationMessage } from "./projectChatMessage.utils";

interface ProjectTabsProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  activeWorkflowId?: string;
  generatedSpec: string | undefined;
  conversationHistory: ProjectConversationMessage[];
  streamingActivity?: string;
  sandboxStartupActivity?: string;
  basePath: string;
  repoId: Id<"githubRepos">;
}

export function ProjectTabs({
  projectId,
  projectPhase,
  activeWorkflowId,
  generatedSpec,
  conversationHistory,
  streamingActivity,
  sandboxStartupActivity,
  basePath,
  repoId,
}: ProjectTabsProps) {
  const resetInterview = useMutation(
    api.projectInterviewWorkflow.resetInterview,
  );
  const restartInterview = useMutation(
    api.projectInterviewWorkflow.restartInterview,
  );

  const handleClear = async () => {
    await resetInterview({ projectId });
  };

  const handleRejectSpec = async (reason: string) => {
    await restartInterview({ projectId, reason });
  };

  const specToShow = projectPhase !== "draft" ? generatedSpec : undefined;

  if (!specToShow) {
    return (
      <ProjectChatTab
        projectId={projectId}
        projectPhase={projectPhase}
        activeWorkflowId={activeWorkflowId}
        initialMessages={conversationHistory}
        streamingActivity={streamingActivity ?? sandboxStartupActivity}
        onClear={handleClear}
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
          onClear={handleClear}
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
