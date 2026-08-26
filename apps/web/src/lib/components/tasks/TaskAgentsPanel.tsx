"use client";

import { useMutation } from "convex/react";
import { api, type Id } from "@eva/backend";
import { AgentsPanel } from "@/lib/components/sandbox/AgentsPanel";
import type { SubagentView } from "@/lib/components/sandbox/agentActivity";
import { catchMutationError } from "@/lib/utils/mutationToast";

/** Task twin of `SessionAgentsPanel` — same roster, task stop mutation. */
export function TaskAgentsPanel({
  taskId,
  agents,
}: {
  taskId: Id<"agentTasks">;
  agents: SubagentView[];
}) {
  const requestStop = useMutation(
    api.agentTaskChatWorkflow.requestStopBackgroundAgent,
  );

  return (
    <AgentsPanel
      agents={agents}
      onRequestStop={async (toolUseId) => {
        await catchMutationError(
          requestStop({ taskId, toolUseId }),
          "Couldn't stop agent",
          "task-agent-stop",
        );
      }}
    />
  );
}
