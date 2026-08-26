"use client";

import { useMutation } from "convex/react";
import { api, type Id } from "@eva/backend";
import { AgentsPanel } from "@/lib/components/sandbox/AgentsPanel";
import type { SubagentView } from "@/lib/components/sandbox/agentActivity";
import { catchMutationError } from "@/lib/utils/mutationToast";

export function SessionAgentsPanel({
  sessionId,
  agents,
  isReadOnly,
}: {
  sessionId: Id<"sessions">;
  agents: SubagentView[];
  isReadOnly?: boolean;
}) {
  const requestStop = useMutation(
    api.sessionWorkflow.requestStopBackgroundAgent,
  );

  return (
    <AgentsPanel
      agents={agents}
      isReadOnly={isReadOnly}
      onRequestStop={async (toolUseId) => {
        await catchMutationError(
          requestStop({ sessionId, toolUseId }),
          "Couldn't stop agent",
          "session-agent-stop",
        );
      }}
    />
  );
}
