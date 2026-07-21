"use client";

import { api, normalizeAIModel, type Id } from "@conductor/backend";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useProviderAccounts } from "@/lib/hooks/useAvailableAiModels";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";

/**
 * Sends an annotation as chat display text + rich agent prompt.
 * Queues with displayContent when a turn is already running.
 */
export function useSessionAnnotationSend(
  sessionId: Id<"sessions">,
): (display: string, full: string) => Promise<void> {
  const { repo } = useRepo();
  const defaultModel = normalizeAIModel(repo.defaultModel);
  const { mode, model, executionTraits, providerAccountId } =
    useSessionSettings(String(sessionId), { defaultModel });
  const { resolveId: resolveAccountId } = useProviderAccounts();

  const messages = useQuery(api.messages.listByParent, {
    parentId: sessionId,
  });
  const addMessage = useMutation(api.sessions.addMessage);
  const startExecution = useMutation(api.sessionWorkflow.startExecute);
  const enqueueMessage = useMutation(api.sessionWorkflow.enqueueMessage);

  const lastMessage = messages?.[messages.length - 1];
  const isExecuting = Boolean(
    lastMessage && lastMessage.role === "assistant" && !lastMessage.content,
  );

  return async (display: string, full: string) => {
    const accountId = resolveAccountId(providerAccountId);
    if (isExecuting) {
      await enqueueMessage({
        sessionId,
        message: full,
        displayContent: display,
        mode,
        model,
        ...executionTraits,
        providerAccountId: accountId,
      });
      return;
    }
    await Promise.all([
      addMessage({
        id: sessionId,
        role: "user",
        content: display,
        mode,
        providerAccountId: accountId,
      }),
      startExecution({
        sessionId,
        message: full,
        mode,
        model,
        ...executionTraits,
        providerAccountId: accountId,
      }),
    ]).catch(async (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send annotation";
      await addMessage({
        id: sessionId,
        role: "assistant",
        content: `Error: ${errorMessage}`,
        mode,
      });
    });
  };
}
