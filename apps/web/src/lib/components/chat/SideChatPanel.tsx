"use client";

import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  api,
  buildTraitsExecutionPayload,
  DEFAULT_AI_MODEL,
  getLockedProviderModelOptions,
  normalizeAIModel,
  resolveTraitsForDisplay,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@eva/backend";
import { ChatBody } from "./ChatBody";
import { BackgroundAgentsChip } from "./BackgroundAgentsChip";
import { useChatDraftSeed, type ChatDraftTarget } from "./useChatDraftSeed";
import type { ChatTab } from "./useChatTabs";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useChatOwnerProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";

interface SideChatPanelProps {
  chat: ChatTab;
  isSandboxActive: boolean;
  isReadOnly?: boolean;
  onOpenFile?: (path: string) => void;
  onViewDiff?: (repoRelativePath?: string) => void;
}

export function SideChatPanel({
  chat,
  isSandboxActive,
  isReadOnly = false,
  onOpenFile,
  onViewDiff,
}: SideChatPanelProps) {
  const { repo, basePath } = useRepo();
  const messages = useQuery(api.messages.listByParent, {
    parentId: chat._id,
  });
  const queuedMessages = useQuery(api.queuedMessages.listByParent, {
    parentId: chat._id,
  });
  const streaming = useQuery(api.streaming.get, {
    entityId: String(chat._id),
  });
  const activeQuestion = useQuery(api.pendingQuestions.getActive, {
    entityId: String(chat._id),
  });
  const currentUserId = useQuery(api.auth.me);

  const addMessage = useMutation(api.chatWorkflow.addMessage);
  const startExecute = useMutation(api.chatWorkflow.startExecute);
  const enqueueMessage = useMutation(api.chatWorkflow.enqueueMessage);
  const cancelExecution = useMutation(api.chatWorkflow.cancelExecution);
  const setModelMutation = useMutation(api.chats.setModel);
  const setTraitsMutation = useMutation(api.chats.setTraits);
  const setAccountMutation = useMutation(api.chats.setProviderAccountId);
  const answerPendingQuestion = useMutation(api.pendingQuestions.answer);
  const requestStopBackgroundAgent = useMutation(
    api.chatWorkflow.requestStopBackgroundAgent,
  );

  const model = normalizeAIModel(
    chat.lastModel ?? repo.defaultModel ?? DEFAULT_AI_MODEL,
  );
  const storedTraits: StoredModelTraits = {
    effortLevel: chat.lastReasoningLevel,
    thinkingEnabled: chat.lastThinkingEnabled,
    use1mContext: chat.lastUse1mContext,
    fastMode: chat.lastFastMode,
  };
  const displayTraits = resolveTraitsForDisplay(model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(model, storedTraits);
  const { options: availableModels } = useAvailableAiModels(repo._id, model);
  const modelOptions = getLockedProviderModelOptions(
    availableModels,
    chat.provider,
  );
  const { options: accounts, resolveId: resolveAccountId } =
    useChatOwnerProviderAccounts(chat._id);
  const providerAccountId = chat.providerAccountId ?? null;
  const isOwner = currentUserId === chat.createdBy;

  const draftTarget: ChatDraftTarget = { kind: "chat", chatId: chat._id };
  const draftSeed = useChatDraftSeed(draftTarget);
  const draftBundle = draftSeed.isReady
    ? {
        target: draftTarget,
        initialDisplay: draftSeed.initialDisplay,
        mentionMap: draftSeed.mentionMap,
        skillMap: draftSeed.skillMap,
      }
    : undefined;

  const lastMessage = messages?.[messages.length - 1];
  const isExecuting =
    chat.isRunning ||
    Boolean(
      lastMessage &&
      lastMessage.role === "assistant" &&
      !lastMessage.content &&
      lastMessage.finishedAt === undefined,
    );

  const setModel = (next: AIModel) => {
    void setModelMutation({ id: chat._id, model: normalizeAIModel(next) });
  };

  const onTraitsChange = (partial: Partial<StoredModelTraits>) => {
    const reasoningLevel: ReasoningLevel | undefined = partial.effortLevel;
    void setTraitsMutation({
      id: chat._id,
      reasoningLevel,
      thinkingEnabled: partial.thinkingEnabled,
      use1mContext: partial.use1mContext,
      fastMode: partial.fastMode,
    });
  };

  const handleSend = async (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => {
    const accountId = resolveAccountId(providerAccountId);
    if (isExecuting) {
      await enqueueMessage({
        chatId: chat._id,
        message: content,
        model,
        ...executionTraits,
        reasoningLevel:
          displayTraits.effortLevel ?? executionTraits.reasoningLevel,
        providerAccountId: accountId,
        attachmentStorageIds,
      });
      return;
    }
    try {
      await addMessage({
        chatId: chat._id,
        content,
        attachmentStorageIds,
        model,
        reasoningLevel: displayTraits.effortLevel,
      });
      await startExecute({
        chatId: chat._id,
        message: content,
        model,
        ...executionTraits,
        providerAccountId: accountId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message";
      await addMessage({
        chatId: chat._id,
        role: "assistant",
        content: `Error: ${errorMessage}`,
      });
    }
  };

  return (
    <ChatBody
      repoId={repo._id}
      repoBasePath={basePath}
      conversationId={chat._id}
      messages={messages ?? []}
      queuedMessages={queuedMessages ?? []}
      streamingActivity={streaming?.currentActivity}
      streamingContent={streaming?.currentContent}
      streamingPendingQuestion={streaming?.pendingQuestion}
      blockingQuestion={activeQuestion ?? undefined}
      onAnswerBlockingQuestion={async (toolUseId, answers) => {
        await answerPendingQuestion({
          entityId: String(chat._id),
          toolUseId,
          answer: JSON.stringify(answers),
        });
      }}
      isExecuting={isExecuting}
      isInputDisabled={!isSandboxActive || isReadOnly || Boolean(chat.archived)}
      isArchived={isReadOnly || Boolean(chat.archived)}
      placeholder={
        isSandboxActive
          ? "Ask Eva anything... / for skills · @ to mention"
          : "Sandbox must be running to chat..."
      }
      emptyStateTitle={
        isSandboxActive
          ? "A separate conversation in the same sandbox."
          : "Start the parent sandbox to begin chatting."
      }
      model={model}
      setModel={setModel}
      modelOptions={modelOptions}
      accounts={accounts}
      accountId={providerAccountId}
      onAccountChange={(next) => {
        if (!isOwner) return;
        void setAccountMutation({
          id: chat._id,
          providerAccountId: resolveAccountId(next) ?? null,
        });
      }}
      displayTraits={displayTraits}
      onTraitsChange={onTraitsChange}
      onSend={handleSend}
      onCancel={async () => {
        await cancelExecution({ chatId: chat._id });
      }}
      preInputContent={
        <BackgroundAgentsChip
          backgroundAgents={chat.backgroundAgents}
          onRequestStop={async (toolUseId) => {
            await requestStopBackgroundAgent({
              chatId: chat._id,
              toolUseId,
            });
          }}
        />
      }
      draft={draftBundle}
      isDraftLoading={!draftSeed.isReady}
      onOpenFile={onOpenFile}
      onViewDiff={onViewDiff}
    />
  );
}
