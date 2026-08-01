import { api } from "@eva/backend";
import type { AIModel, Id, ModelTraitsExecutionArgs } from "@eva/backend";
import { useMutation } from "convex/react";

import type { SessionMode } from "@/lib/hooks/useSessionSettings";
import {
  appendReviewCommentsToPrompt,
  stripReviewCommentBlocks,
} from "@/lib/reviewComments";
import { usePendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
import {
  useChatRuntime,
  type ChatActiveTurn,
} from "@/lib/components/chat/useChatRuntime";
import { optimisticallySubmitSessionTurn } from "@/lib/components/chat/chatOptimisticUpdates";

interface UseSessionSendParams {
  sessionId: Id<"sessions">;
  mode: SessionMode;
  model: AIModel;
  executionTraits: ModelTraitsExecutionArgs;
  /** Effective effort shown in the composer; snapshotted onto the user message. */
  reasoningLevel?: ModelTraitsExecutionArgs["reasoningLevel"];
  providerAccountId: string | null;
  resolveAccountId: (
    id: string | null,
  ) => Id<"userProviderAccounts"> | undefined;
  activeTurn?: ChatActiveTurn;
  legacyBusy: boolean;
  personaId?: Id<"designPersonas">;
  numDesigns?: number;
}

export function useSessionSend({
  sessionId,
  mode,
  model,
  executionTraits,
  reasoningLevel,
  providerAccountId,
  resolveAccountId,
  activeTurn,
  legacyBusy,
  personaId,
  numDesigns,
}: UseSessionSendParams) {
  const review = usePendingReviewComments();
  const submitTurn = useMutation(
    api.sessionWorkflow.submitTurn,
  ).withOptimisticUpdate(optimisticallySubmitSessionTurn);
  const cancelExecution = useMutation(api.sessionWorkflow.cancelExecution);
  const accountId = resolveAccountId(providerAccountId);
  const effectiveReasoningLevel =
    reasoningLevel ?? executionTraits.reasoningLevel;

  const runtime = useChatRuntime({
    parentId: sessionId,
    streamingEntityId: sessionId,
    questionEntityId: sessionId,
    activeTurn,
    legacyBusy,
    submissionKey: [
      mode,
      model,
      effectiveReasoningLevel ?? "",
      String(executionTraits.thinkingEnabled ?? ""),
      String(executionTraits.use1mContext ?? ""),
      providerAccountId ?? "",
      personaId ?? "",
      String(numDesigns ?? ""),
    ].join("|"),
    submitAction: ({ turnId, content, attachmentStorageIds }) =>
      submitTurn({
        sessionId,
        turnId,
        message: content,
        displayContent: stripReviewCommentBlocks(content).text,
        mode,
        model,
        ...executionTraits,
        reasoningLevel: effectiveReasoningLevel,
        providerAccountId: accountId,
        attachmentStorageIds,
        ...(mode === "design" ? { personaId, numDesigns } : {}),
      }),
    cancelAction: async (turn) => {
      await cancelExecution({
        sessionId,
        ...(turn === undefined
          ? {}
          : {
              turnId: turn.turnId,
              assistantMessageId: turn.assistantMessageId,
              attempt: turn.attempt,
            }),
      });
    },
  });

  const handleSend = async (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => {
    const finalContent = appendReviewCommentsToPrompt(
      content,
      review?.comments ?? [],
    );
    await runtime.handleSend(finalContent, attachmentStorageIds);
    review?.clear();
  };

  return { ...runtime, handleSend };
}
