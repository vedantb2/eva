"use client";

import { api, normalizeAIModel, type Id } from "@eva/backend";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useProviderAccounts } from "@/lib/hooks/useAvailableAiModels";
import { useSessionModel } from "@/lib/hooks/useSessionModel";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { isAssistantTurnInProgress } from "@/lib/components/chat/chatBodyUtils";

/**
 * Sends an annotation as chat display text + rich agent prompt.
 * Queues with displayContent when a turn is already running.
 */
export function useSessionAnnotationSend(
  sessionId: Id<"sessions">,
): (display: string, full: string) => Promise<void> {
  const { repo } = useRepo();
  const defaultModel = normalizeAIModel(repo.defaultModel);
  // Model + mode + traits + account are owned by Convex.
  const {
    model,
    mode: stickyMode,
    traits,
    providerAccountId: stickyProviderAccountId,
  } = useSessionModel(sessionId, defaultModel);
  const { mode, displayTraits, executionTraits, providerAccountId } =
    useSessionSettings({
      defaultModel,
      model,
      mode: stickyMode,
      traits,
      providerAccountId: stickyProviderAccountId,
    });
  const { resolveId: resolveAccountId } = useProviderAccounts();

  const messages = useQuery(api.messages.listByParent, {
    parentId: sessionId,
  });
  const addMessage = useMutation(api.sessions.addMessage);
  const startExecution = useMutation(api.sessionWorkflow.startExecute);
  const enqueueMessage = useMutation(api.sessionWorkflow.enqueueMessage);

  const isExecuting = isAssistantTurnInProgress(messages ?? []);

  return async (display: string, full: string) => {
    const accountId = resolveAccountId(providerAccountId);
    const reasoningLevel = displayTraits.effortLevel;
    if (isExecuting) {
      await enqueueMessage({
        sessionId,
        message: full,
        displayContent: display,
        mode,
        model,
        ...executionTraits,
        reasoningLevel,
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
        model,
        reasoningLevel,
      }),
      startExecution({
        sessionId,
        message: full,
        mode,
        model,
        ...executionTraits,
        reasoningLevel,
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
