"use client";

import { useCallback } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useLocalStorage } from "usehooks-ts";
import {
  api,
  DEFAULT_AI_MODEL,
  DEFAULT_REASONING_LEVEL,
  findAIModelOption,
  normalizeAIModel,
  type AIModel,
  type Id,
  type ReasoningLevel,
} from "@conductor/backend";
import {
  ChatBody,
  type ChatBodyQueuedMessage,
} from "@/lib/components/chat/ChatBody";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";

interface StoredSettings {
  model: AIModel;
  reasoningLevel: ReasoningLevel;
  providerAccountId?: string | null;
}

function chatSettingsKey(parentId: string) {
  return `conductor:chat-settings:${parentId}`;
}

interface TaskSandboxChatPanelProps {
  taskId: Id<"agentTasks">;
  isSandboxActive: boolean;
}

export function TaskSandboxChatPanel({
  taskId,
  isSandboxActive,
}: TaskSandboxChatPanelProps) {
  const { repo, basePath } = useRepo();
  const task = useQuery(api.agentTasks.get, { id: taskId });
  const messages = useQuery(api.messages.listByParent, { parentId: taskId });
  const queuedMessages = useQuery(api.queuedMessages.listByParent, {
    parentId: taskId,
  });
  const streaming = useQuery(api.streaming.get, {
    entityId: `task-chat-${taskId}`,
  });

  const addMessage = useMutation(api.agentTaskChatWorkflow.addMessage);
  const startExecute = useMutation(api.agentTaskChatWorkflow.startExecute);
  const enqueueMessage = useMutation(api.agentTaskChatWorkflow.enqueueMessage);
  const cancelExecution = useMutation(
    api.agentTaskChatWorkflow.cancelExecution,
  );

  const defaultModel = normalizeAIModel(repo.defaultModel ?? DEFAULT_AI_MODEL);
  const [settings, setSettings] = useLocalStorage<StoredSettings>(
    chatSettingsKey(taskId),
    { model: defaultModel, reasoningLevel: DEFAULT_REASONING_LEVEL },
  );
  const model = normalizeAIModel(settings.model);
  const reasoningLevel = settings.reasoningLevel ?? DEFAULT_REASONING_LEVEL;
  const providerAccountId = settings.providerAccountId ?? null;
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);
  const { options: accounts, resolveId: resolveAccountId } =
    useProviderAccounts();

  const setModel = useCallback(
    (next: AIModel) =>
      setSettings((prev) => ({ ...prev, model: normalizeAIModel(next) })),
    [setSettings],
  );

  const setReasoningLevel = useCallback(
    (next: ReasoningLevel) =>
      setSettings((prev) => ({ ...prev, reasoningLevel: next })),
    [setSettings],
  );

  const setProviderAccountId = useCallback(
    (next: string | null) =>
      setSettings((prev) => ({ ...prev, providerAccountId: next })),
    [setSettings],
  );

  const lastMessage = messages?.[messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting =
    Boolean(task?.activeChatWorkflowId) || lastAssistantHasNoContent;

  const handleSend = useCallback(
    async (content: string, attachmentStorageIds?: Id<"_storage">[]) => {
      if (isExecuting) {
        await enqueueMessage({
          taskId,
          message: content,
          model,
          reasoningLevel,
          providerAccountId: resolveAccountId(providerAccountId),
          attachmentStorageIds,
        });
        return;
      }
      const accountId = resolveAccountId(providerAccountId);
      await addMessage({
        taskId,
        content,
        attachmentStorageIds,
        providerAccountId: accountId,
      });
      await startExecute({
        taskId,
        message: content,
        model,
        reasoningLevel,
        providerAccountId: accountId,
      });
    },
    [
      isExecuting,
      enqueueMessage,
      addMessage,
      startExecute,
      taskId,
      model,
      reasoningLevel,
      providerAccountId,
      resolveAccountId,
    ],
  );

  const handleCancel = useCallback(async () => {
    await cancelExecution({ taskId });
  }, [cancelExecution, taskId]);

  const formatQueuedInfo = useCallback((msg: ChatBodyQueuedMessage) => {
    const parts = [
      msg.model ? findAIModelOption(msg.model).label : null,
    ].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(" / ") : undefined;
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col w-full">
      <ChatBody
        repoId={repo._id}
        repoBasePath={basePath}
        conversationId={taskId}
        messages={messages ?? []}
        queuedMessages={queuedMessages ?? []}
        streamingActivity={streaming?.currentActivity}
        streamingContent={streaming?.currentContent}
        streamingPendingQuestion={streaming?.pendingQuestion}
        isExecuting={isExecuting}
        isInputDisabled={!isSandboxActive}
        placeholder={
          !isSandboxActive
            ? "Sandbox must be running to chat..."
            : "Ask Eva about this task's sandbox..."
        }
        emptyStateTitle={
          isSandboxActive
            ? "Ask Eva anything about this task's running sandbox."
            : "Sandbox is inactive. Start it to begin chatting."
        }
        model={model}
        setModel={setModel}
        modelOptions={modelOptions}
        accounts={accounts}
        accountId={providerAccountId}
        onAccountChange={setProviderAccountId}
        reasoningLevel={reasoningLevel}
        onReasoningLevelChange={setReasoningLevel}
        onSend={handleSend}
        onCancel={handleCancel}
        formatQueuedInfo={formatQueuedInfo}
      />
    </div>
  );
}
