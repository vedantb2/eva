import { api } from "@eva/backend";
import type { AIModel, Id, ModelTraitsExecutionArgs } from "@eva/backend";
import type { ModelAccount } from "@eva/ui";
import { useMutation } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionArgs, FunctionReturnType } from "convex/server";

import type { SessionMode } from "@/lib/hooks/useSessionSettings";
import { resolveCredentialSourceLabel } from "@/lib/utils/credentialSourceLabel";
import { appendReviewCommentsToPrompt } from "@/lib/reviewComments";
import { usePendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
import { useTurnInProgress } from "@/lib/components/chat/useTurnInProgress";
export type SessionMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];

// Convex has no non-assertion way to mint an Id<T> before the server assigns
// one; this is the single, contained assertion for optimistic-insert temp ids.
function optimisticMessageId(): Id<"messages"> {
  // oxlint-disable-next-line typescript/consistent-type-assertions -- Convex Id<T> is an opaque branded string; there is no non-assertion way to mint a client-side optimistic temp id
  return crypto.randomUUID() as Id<"messages">;
}

function applyAddMessageOptimistically(
  localStore: OptimisticLocalStore,
  args: FunctionArgs<typeof api.sessions.addMessage>,
  accounts: ReadonlyArray<ModelAccount>,
) {
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
    media: undefined,
    attachmentStorageIds: args.attachmentStorageIds,
    attachmentUrls: undefined,
    attachments: undefined,
    credentialSourceLabel: resolveCredentialSourceLabel(
      args.providerAccountId,
      accounts,
    ),
    model: args.model,
    reasoningLevel: args.reasoningLevel,
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
    media: undefined,
    attachmentUrls: undefined,
    attachments: undefined,
  };
  localStore.setQuery(api.messages.listByParent, { parentId: args.id }, [
    ...existing,
    userMsg,
    assistantPlaceholder,
  ]);
  // The composer reads "working" from the turn row, so the optimistic send has
  // to open one locally too — otherwise the stop button and the queue-instead-
  // of-send branch would both wait a round-trip behind the bubble they belong to.
  localStore.setQuery(
    api.turns.getOpen,
    { surface: "session", entityId: args.id },
    { state: "staged", turnStartedAt: now, model: args.model ?? "unknown" },
  );
}

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
  accounts: ReadonlyArray<ModelAccount>;
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
  accounts,
  personaId,
  numDesigns,
}: UseSessionSendParams) {
  const review = usePendingReviewComments();
  const addMessage = useMutation(api.sessions.addMessage).withOptimisticUpdate(
    (localStore, args) =>
      applyAddMessageOptimistically(localStore, args, accounts),
  );
  const startExecution = useMutation(api.sessionWorkflow.startExecute);
  const enqueueMessage = useMutation(api.sessionWorkflow.enqueueMessage);
  const cancelExecutionMutation = useMutation(
    api.sessionWorkflow.cancelExecution,
  );

  const isExecuting = useTurnInProgress("session", sessionId);

  const designArgs =
    mode === "design"
      ? {
          personaId,
          numDesigns,
        }
      : {};

  const handleSend = async (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => {
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
        ...executionTraits,
        reasoningLevel: reasoningLevel ?? executionTraits.reasoningLevel,
        providerAccountId: resolveAccountId(providerAccountId),
        attachmentStorageIds,
        ...designArgs,
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
        model,
        reasoningLevel: reasoningLevel ?? executionTraits.reasoningLevel,
        ...designArgs,
      }),
      startExecution({
        sessionId,
        message: finalContent,
        mode,
        model,
        ...executionTraits,
        reasoningLevel: reasoningLevel ?? executionTraits.reasoningLevel,
        providerAccountId: accountId,
        attachmentStorageIds,
        ...designArgs,
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
  };

  const handleCancel = async () => {
    await cancelExecutionMutation({ sessionId });
  };

  return { isExecuting, handleSend, handleCancel };
}
