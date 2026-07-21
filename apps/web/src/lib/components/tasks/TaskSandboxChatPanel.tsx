"use client";

import { useCallback } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useLocalStorage } from "usehooks-ts";
import {
  api,
  buildTraitsExecutionPayload,
  DEFAULT_AI_MODEL,
  findAIModelOption,
  normalizeAIModel,
  resolveTraitsForDisplay,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@conductor/backend";
import {
  ChatBody,
  type ChatBodyQueuedMessage,
} from "@/lib/components/chat/ChatBody";
import { useChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { SandboxPanelToggleButton } from "@/lib/components/sandbox/SandboxPanelToggleButton";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";

interface StoredSettings {
  model: AIModel;
  effortLevel?: ReasoningLevel;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
  providerAccountId?: string | null;
}

function chatSettingsKey(parentId: string) {
  return `conductor:chat-settings:${parentId}`;
}

interface TaskSandboxChatPanelProps {
  taskId: Id<"agentTasks">;
  isSandboxActive: boolean;
  /** Opens the Files tab and loads this sandbox path in the file viewer. */
  onOpenFile?: (path: string) => void;
  sandboxCollapsed?: boolean;
  onToggleSandbox?: () => void;
}

export function TaskSandboxChatPanel({
  taskId,
  isSandboxActive,
  onOpenFile,
  sandboxCollapsed,
  onToggleSandbox,
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
    { model: defaultModel },
  );
  const model = normalizeAIModel(settings.model);
  const storedTraits: StoredModelTraits = {
    effortLevel: settings.effortLevel,
    thinkingEnabled: settings.thinkingEnabled,
    use1mContext: settings.use1mContext,
  };
  const displayTraits = resolveTraitsForDisplay(model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(model, storedTraits);
  const providerAccountId = settings.providerAccountId ?? null;
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);
  const { options: accounts, resolveId: resolveAccountId } =
    useProviderAccounts();

  const draftSeed = useChatDraftSeed({
    kind: "taskChat" as const,
    taskId,
  });
  const draftBundle = draftSeed.isReady
    ? {
        target: { kind: "taskChat" as const, taskId },
        initialDisplay: draftSeed.initialDisplay,
        mentionMap: draftSeed.mentionMap,
        skillMap: draftSeed.skillMap,
      }
    : undefined;

  // Same entityId the task-chat sandbox posts with (task id, not stream prefix).
  const activeQuestion = useQuery(api.pendingQuestions.getActive, {
    entityId: taskId,
  });
  const answerPendingQuestion = useMutation(api.pendingQuestions.answer);
  const handleAnswerBlockingQuestion = useCallback(
    async (toolUseId: string, answers: Record<string, string>) => {
      await answerPendingQuestion({
        entityId: taskId,
        toolUseId,
        answer: JSON.stringify(answers),
      });
    },
    [answerPendingQuestion, taskId],
  );

  const setModel = useCallback(
    (next: AIModel) =>
      setSettings((prev) => ({ ...prev, model: normalizeAIModel(next) })),
    [setSettings],
  );

  const onTraitsChange = useCallback(
    (partial: Partial<StoredModelTraits>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
    },
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
          ...executionTraits,
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
        ...executionTraits,
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
      executionTraits,
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
    <div className="flex h-full min-h-0 w-full flex-col">
      {onToggleSandbox ? (
        <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-1">
          <SandboxPanelToggleButton
            collapsed={sandboxCollapsed === true}
            onToggle={onToggleSandbox}
          />
        </div>
      ) : null}
      <ChatBody
        repoId={repo._id}
        repoBasePath={basePath}
        conversationId={taskId}
        messages={messages ?? []}
        queuedMessages={queuedMessages ?? []}
        streamingActivity={streaming?.currentActivity}
        streamingContent={streaming?.currentContent}
        streamingPendingQuestion={streaming?.pendingQuestion}
        blockingQuestion={activeQuestion ?? undefined}
        onAnswerBlockingQuestion={handleAnswerBlockingQuestion}
        isExecuting={isExecuting}
        isInputDisabled={!isSandboxActive}
        placeholder={
          !isSandboxActive
            ? "Sandbox must be running to chat..."
            : "Ask Eva anything... / for skills · @ for docs"
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
        displayTraits={displayTraits}
        onTraitsChange={onTraitsChange}
        onSend={handleSend}
        onCancel={handleCancel}
        formatQueuedInfo={formatQueuedInfo}
        draft={draftBundle}
        isDraftLoading={!draftSeed.isReady}
        onOpenFile={onOpenFile}
      />
    </div>
  );
}
