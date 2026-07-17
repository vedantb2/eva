import { api } from "@conductor/backend";
import type { AIModel, Id, ReasoningLevel } from "@conductor/backend";
import type { ModelAccount } from "@conductor/ui";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback } from "react";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";
import { resolveCredentialSourceLabel } from "@/lib/utils/credentialSourceLabel";
import { appendReviewCommentsToPrompt } from "@/lib/reviewComments";
import { usePendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
export type SessionMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];

// Convex has no non-assertion way to mint an Id<T> before the server assigns
// one; this is the single, contained assertion for optimistic-insert temp ids.
function optimisticMessageId(): Id<"messages"> {
  // oxlint-disable-next-line typescript/consistent-type-assertions -- Convex Id<T> is an opaque branded string; there is no non-assertion way to mint a client-side optimistic temp id
  return crypto.randomUUID() as Id<"messages">;
}

interface UseSessionSendParams {
  sessionId: Id<"sessions">;
  mode: SessionMode;
  model: AIModel;
  reasoningLevel: ReasoningLevel;
  providerAccountId: string | null;
  resolveAccountId: (
    id: string | null,
  ) => Id<"userProviderAccounts"> | undefined;
  accounts: ReadonlyArray<ModelAccount>;
  messages: SessionMessage[];
}

export function useSessionSend({
  sessionId,
  mode,
  model,
  reasoningLevel,
  providerAccountId,
  resolveAccountId,
  accounts,
  messages,
}: UseSessionSendParams) {
  const review = usePendingReviewComments();
  const addMessage = useMutation(api.sessions.addMessage).withOptimisticUpdate(
    (localStore, args) => {
      if (args.role !== "user") return;
      const existing = localStore.getQuery(api.messages.listByParent, {
        parentId: args.id,
      });
      if (existing === undefined) return;

      const now = Date.now();
      const userMsg: SessionMessage = {
        _id: optimisticMessageId(),
        _creationTime: now,
        parentId: args.id,
        role: "user",
        content: args.content,
        timestamp: now,
        mode: args.mode,
        activityLog: "",
        imageUrl: undefined,
        videoUrl: undefined,
        attachmentStorageIds: args.attachmentStorageIds,
        attachmentUrls: undefined,
        credentialSourceLabel: resolveCredentialSourceLabel(
          args.providerAccountId,
          accounts,
        ),
      };
      const assistantPlaceholder: SessionMessage = {
        _id: optimisticMessageId(),
        _creationTime: now + 1,
        parentId: args.id,
        role: "assistant",
        content: "",
        timestamp: now + 1,
        mode: args.mode,
        activityLog: "",
        imageUrl: undefined,
        videoUrl: undefined,
        attachmentUrls: undefined,
      };
      localStore.setQuery(api.messages.listByParent, { parentId: args.id }, [
        ...existing,
        userMsg,
        assistantPlaceholder,
      ]);
    },
  );
  const startExecution = useMutation(api.sessionWorkflow.startExecute);
  const enqueueMessage = useMutation(api.sessionWorkflow.enqueueMessage);
  const cancelExecutionMutation = useMutation(
    api.sessionWorkflow.cancelExecution,
  );

  const lastMessage = messages[messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting = lastAssistantHasNoContent;

  const handleSend = useCallback(
    async (content: string, attachmentStorageIds?: Id<"_storage">[]) => {
      const finalContent = appendReviewCommentsToPrompt(
        content,
        review?.comments ?? [],
      );
      if (isExecuting) {
        await enqueueMessage({
          sessionId,
          message: finalContent,
          mode,
          model,
          reasoningLevel,
          providerAccountId: resolveAccountId(providerAccountId),
          attachmentStorageIds,
        });
        review?.clear();
        return;
      }
      const accountId = resolveAccountId(providerAccountId);
      void Promise.all([
        addMessage({
          id: sessionId,
          role: "user",
          content: finalContent,
          mode,
          attachmentStorageIds,
          providerAccountId: accountId,
        }),
        startExecution({
          sessionId,
          message: finalContent,
          mode,
          model,
          reasoningLevel,
          providerAccountId: accountId,
          attachmentStorageIds,
        }),
      ])
        .catch(async (error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to send message";
          await addMessage({
            id: sessionId,
            role: "assistant",
            content: `Error: ${errorMessage}`,
            mode,
          });
        })
        .finally(() => {
          review?.clear();
        });
    },
    [
      isExecuting,
      enqueueMessage,
      addMessage,
      startExecution,
      sessionId,
      mode,
      model,
      reasoningLevel,
      providerAccountId,
      resolveAccountId,
      review,
    ],
  );

  const handleCancel = useCallback(async () => {
    await cancelExecutionMutation({ sessionId });
  }, [cancelExecutionMutation, sessionId]);

  return { isExecuting, handleSend, handleCancel };
}
