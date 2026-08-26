"use client";

import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { catchMutationError } from "@/lib/utils/mutationToast";
import type { ChatEntityRef } from "@/lib/components/chat/sandboxChatSurface";

/**
 * Stops one background sub-agent on whichever entity owns the chat. All three
 * mutations register unconditionally — hooks cannot be called conditionally,
 * and an unused `useMutation` costs nothing.
 */
export function useStopBackgroundAgent(
  entity: ChatEntityRef,
): (toolUseId: string) => Promise<void> {
  const stopSessionAgent = useMutation(
    api.sessionWorkflow.requestStopBackgroundAgent,
  );
  const stopTaskAgent = useMutation(
    api.agentTaskChatWorkflow.requestStopBackgroundAgent,
  );
  const stopProjectAgent = useMutation(
    api.projectChatWorkflow.requestStopBackgroundAgent,
  );

  return async (toolUseId: string) => {
    const request =
      entity.kind === "session"
        ? stopSessionAgent({ sessionId: entity.sessionId, toolUseId })
        : entity.kind === "task"
          ? stopTaskAgent({ taskId: entity.taskId, toolUseId })
          : stopProjectAgent({ projectId: entity.projectId, toolUseId });
    await catchMutationError(
      request,
      "Couldn't stop agent",
      `${entity.kind}-agent-stop`,
    );
  };
}
