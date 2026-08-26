"use client";

import { useMutation } from "convex/react";
import { api, type Id } from "@eva/backend";
import { AgentsPanel } from "@/lib/components/sandbox/AgentsPanel";
import type { SubagentView } from "@/lib/components/sandbox/agentActivity";
import { catchMutationError } from "@/lib/utils/mutationToast";

/** Project twin of `SessionAgentsPanel` — same roster, project stop mutation. */
export function ProjectAgentsPanel({
  projectId,
  agents,
}: {
  projectId: Id<"projects">;
  agents: SubagentView[];
}) {
  const requestStop = useMutation(
    api.projectChatWorkflow.requestStopBackgroundAgent,
  );

  return (
    <AgentsPanel
      agents={agents}
      onRequestStop={async (toolUseId) => {
        await catchMutationError(
          requestStop({ projectId, toolUseId }),
          "Couldn't stop agent",
          "project-agent-stop",
        );
      }}
    />
  );
}
