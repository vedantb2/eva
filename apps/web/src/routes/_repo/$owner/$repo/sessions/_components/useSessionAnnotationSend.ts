"use client";

import { api, normalizeAIModel, type Id } from "@eva/backend";
import { useMutation } from "convex/react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useProviderAccounts } from "@/lib/hooks/useAvailableAiModels";
import { useSessionModel } from "@/lib/hooks/useSessionModel";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { optimisticallySubmitSessionTurn } from "@/lib/components/chat/chatOptimisticUpdates";

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

  const submitTurn = useMutation(
    api.sessionWorkflow.submitTurn,
  ).withOptimisticUpdate(optimisticallySubmitSessionTurn);

  return async (display: string, full: string) => {
    const accountId = resolveAccountId(providerAccountId);
    const reasoningLevel = displayTraits.effortLevel;
    await submitTurn({
      sessionId,
      turnId: crypto.randomUUID(),
      message: full,
      displayContent: display,
      mode,
      model,
      ...executionTraits,
      reasoningLevel,
      providerAccountId: accountId,
    });
  };
}
