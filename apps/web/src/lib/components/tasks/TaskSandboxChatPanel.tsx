"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import {
  api,
  buildTraitsExecutionPayload,
  DEFAULT_AI_MODEL,
  normalizeAIModel,
  resolveTraitsForDisplay,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@eva/backend";
import { ChatBody } from "@/lib/components/chat/ChatBody";
import { useChatRuntime } from "@/lib/components/chat/useChatRuntime";
import { TaskChatOptionsSubmenu } from "@/lib/components/chat/ChatOptionsSubmenu";
import { useChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { SandboxPanelToggleButton } from "@/lib/components/sandbox/SandboxPanelToggleButton";
import { BackgroundAgentsChip } from "@/lib/components/chat/BackgroundAgentsChip";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useTaskOwnerProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";

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
  const submitTurn = useMutation(api.agentTaskChatWorkflow.submitTurn);
  const cancelExecution = useMutation(
    api.agentTaskChatWorkflow.cancelExecution,
  );
  const updateTask = useMutation(api.agentTasks.update);
  const setTraitsMutation = useMutation(
    api.agentTasks.setTraits,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.agentTasks.get, { id: args.id });
    if (!current) return;
    localStore.setQuery(
      api.agentTasks.get,
      { id: args.id },
      {
        ...current,
        ...(args.reasoningLevel !== undefined
          ? { lastReasoningLevel: args.reasoningLevel }
          : {}),
        ...(args.thinkingEnabled !== undefined
          ? { lastThinkingEnabled: args.thinkingEnabled }
          : {}),
        ...(args.use1mContext !== undefined
          ? { lastUse1mContext: args.use1mContext }
          : {}),
      },
    );
  });
  const requestStopBackgroundAgent = useMutation(
    api.agentTaskChatWorkflow.requestStopBackgroundAgent,
  );

  // Model + account stay on the task doc (shared with activity composer).
  // Traits are sticky on Convex like sessions (no localStorage).
  const model = normalizeAIModel(
    task?.model ?? repo.defaultModel ?? DEFAULT_AI_MODEL,
  );
  const storedTraits: StoredModelTraits = {
    effortLevel: task?.lastReasoningLevel,
    thinkingEnabled: task?.lastThinkingEnabled,
    use1mContext: task?.lastUse1mContext,
  };
  const providerAccountId = task?.providerAccountId ?? null;
  const { options: modelOptions, providerCapabilities } = useAvailableAiModels(
    repo._id,
    model,
    providerAccountId,
  );
  const displayTraits = resolveTraitsForDisplay(
    model,
    storedTraits,
    providerCapabilities,
  );
  const executionTraits = buildTraitsExecutionPayload(
    model,
    storedTraits,
    providerCapabilities,
  );
  const { options: accounts, resolveId: resolveAccountId } =
    useTaskOwnerProviderAccounts(taskId);
  const currentUserId = useQuery(api.auth.me);
  const isOwner =
    currentUserId !== undefined &&
    task?.createdBy !== undefined &&
    currentUserId === task.createdBy;

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

  const setModel = (next: AIModel) => {
    void updateTask({ id: taskId, model: normalizeAIModel(next) });
  };

  const onTraitsChange = (partial: Partial<StoredModelTraits>) => {
    const reasoningLevel: ReasoningLevel | undefined = partial.effortLevel;
    void setTraitsMutation({
      id: taskId,
      ...(reasoningLevel !== undefined ? { reasoningLevel } : {}),
      ...(partial.thinkingEnabled !== undefined
        ? { thinkingEnabled: partial.thinkingEnabled }
        : {}),
      ...(partial.use1mContext !== undefined
        ? { use1mContext: partial.use1mContext }
        : {}),
    });
  };

  const setProviderAccountId = (next: string | null) => {
    if (!isOwner || !task) return;
    void updateTask({
      id: taskId,
      providerAccountId: resolveAccountId(next) ?? null,
    });
  };

  const runtime = useChatRuntime({
    parentId: taskId,
    streamingEntityId: `task-chat-${taskId}`,
    questionEntityId: taskId,
    activeTurn: task?.activeTurn,
    legacyBusy:
      task?.activeTurn === undefined &&
      task?.activeChatWorkflowId !== undefined,
    submissionKey: [
      model,
      displayTraits.effortLevel ?? "",
      String(executionTraits.thinkingEnabled ?? ""),
      String(executionTraits.use1mContext ?? ""),
      providerAccountId ?? "",
    ].join("|"),
    optimisticMetadata: {
      model,
      reasoningLevel: displayTraits.effortLevel,
    },
    submitAction: ({ turnId, content, attachmentStorageIds }) =>
      submitTurn({
        taskId,
        turnId,
        message: content,
        model,
        ...executionTraits,
        reasoningLevel:
          displayTraits.effortLevel ?? executionTraits.reasoningLevel,
        providerAccountId: resolveAccountId(providerAccountId),
        attachmentStorageIds,
      }),
    cancelAction: async (activeTurn) => {
      await cancelExecution({
        taskId,
        ...(activeTurn === undefined
          ? {}
          : {
              turnId: activeTurn.turnId,
              assistantMessageId: activeTurn.assistantMessageId,
              attempt: activeTurn.attempt,
            }),
      });
    },
  });

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {onToggleSandbox ? (
        <div className="flex shrink-0 items-center justify-end px-2 py-1">
          <SandboxPanelToggleButton
            collapsed={sandboxCollapsed === true}
            onToggle={onToggleSandbox}
          />
        </div>
      ) : null}
      <BackgroundAgentsChip
        backgroundAgents={task?.backgroundAgents}
        onRequestStop={async (toolUseId) => {
          await requestStopBackgroundAgent({ taskId, toolUseId });
        }}
      />
      <ChatBody
        repoId={repo._id}
        repoBasePath={basePath}
        conversationId={taskId}
        messages={runtime.messages}
        queuedMessages={runtime.queuedMessages}
        activeTurn={task?.activeTurn}
        streaming={runtime.streaming ?? undefined}
        blockingQuestion={runtime.activeQuestion ?? undefined}
        optimisticTurn={runtime.optimisticTurn}
        history={{
          firstItemIndex: runtime.firstItemIndex,
          canLoadOlder: runtime.canLoadOlder,
          isLoadingOlder: runtime.isLoadingOlder,
          onLoadOlder: runtime.loadOlder,
        }}
        onAnswerBlockingQuestion={runtime.handleAnswerBlockingQuestion}
        availability={{
          isExecuting: runtime.isExecuting,
          isInputDisabled: !isSandboxActive,
        }}
        placeholder={
          !isSandboxActive
            ? "Sandbox must be running to chat..."
            : "Ask Eva anything... / for skills · @ for data"
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
        providerCapabilities={providerCapabilities}
        onTraitsChange={onTraitsChange}
        onSend={runtime.handleSend}
        onCancel={runtime.handleCancel}
        draft={draftBundle}
        isDraftLoading={!draftSeed.isReady}
        onOpenFile={onOpenFile}
        optionsSubmenu={<TaskChatOptionsSubmenu taskId={taskId} />}
      />
    </div>
  );
}
