"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import {
  api,
  buildTraitsExecutionPayload,
  DEFAULT_AI_MODEL,
  getAIModelProvider,
  normalizeAIModel,
  resolveTraitsForDisplay,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@eva/backend";
import { ChatBody } from "@/lib/components/chat/ChatBody";
import { useChatRuntime } from "@/lib/components/chat/useChatRuntime";
import { optimisticallySubmitProjectTurn } from "@/lib/components/chat/chatOptimisticUpdates";
import { ProjectChatOptionsSubmenu } from "@/lib/components/chat/ChatOptionsSubmenu";
import { useChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { SandboxPanelToggleButton } from "@/lib/components/sandbox/SandboxPanelToggleButton";
import { BackgroundAgentsChip } from "@/lib/components/chat/BackgroundAgentsChip";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";

interface ProjectSandboxChatPanelProps {
  projectId: Id<"projects">;
  isSandboxActive: boolean;
  /** Opens the Files tab and loads this sandbox path in the file viewer. */
  onOpenFile?: (path: string) => void;
  sandboxCollapsed?: boolean;
  onToggleSandbox?: () => void;
}

export function ProjectSandboxChatPanel({
  projectId,
  isSandboxActive,
  onOpenFile,
  sandboxCollapsed,
  onToggleSandbox,
}: ProjectSandboxChatPanelProps) {
  const { repo, basePath } = useRepo();
  const project = useQuery(api.projects.get, { id: projectId });
  const submitTurn = useMutation(
    api.projectChatWorkflow.submitTurn,
  ).withOptimisticUpdate(optimisticallySubmitProjectTurn);
  const cancelExecution = useMutation(api.projectChatWorkflow.cancelExecution);
  const requestStopBackgroundAgent = useMutation(
    api.projectChatWorkflow.requestStopBackgroundAgent,
  );
  const updateProject = useMutation(api.projects.update);
  const setChatModelMutation = useMutation(
    api.projects.setChatModel,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.projects.get, { id: args.id });
    if (!current) return;
    localStore.setQuery(
      api.projects.get,
      { id: args.id },
      { ...current, lastChatModel: args.model },
    );
  });
  const setTraitsMutation = useMutation(
    api.projects.setTraits,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.projects.get, { id: args.id });
    if (!current) return;
    localStore.setQuery(
      api.projects.get,
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

  const defaultModel = normalizeAIModel(repo.defaultModel ?? DEFAULT_AI_MODEL);
  // Sandbox chat model is `lastChatModel` (sticky); falls back to metadata
  // `model` then repo default. Distinct from projects.model build prefs.
  const model = normalizeAIModel(
    project?.lastChatModel ?? project?.model ?? defaultModel,
  );
  const storedTraits: StoredModelTraits = {
    effortLevel: project?.lastReasoningLevel,
    thinkingEnabled: project?.lastThinkingEnabled,
    use1mContext: project?.lastUse1mContext,
  };
  const providerAccountId = project?.providerAccountId ?? null;
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
    useProviderAccounts();
  const currentUserId = useQuery(api.auth.me);
  const isOwner =
    currentUserId !== undefined &&
    project?.userId !== undefined &&
    currentUserId === project.userId;
  const ownerProfile = useQuery(
    api.users.get,
    project?.userId ? { id: project.userId } : "skip",
  );
  const ownerAccountLabel =
    ownerProfile?.firstName?.trim() ||
    ownerProfile?.fullName?.trim() ||
    "Personal";
  const displayAccounts =
    isOwner || !providerAccountId
      ? accounts
      : [
          {
            id: providerAccountId,
            provider: getAIModelProvider(model),
            label: ownerAccountLabel,
          },
          ...accounts,
        ];

  const draftSeed = useChatDraftSeed({
    kind: "projectChat" as const,
    projectId,
  });
  const draftBundle = draftSeed.isReady
    ? {
        target: { kind: "projectChat" as const, projectId },
        initialDisplay: draftSeed.initialDisplay,
        mentionMap: draftSeed.mentionMap,
        skillMap: draftSeed.skillMap,
      }
    : undefined;

  const setModel = (next: AIModel) => {
    void setChatModelMutation({
      id: projectId,
      model: normalizeAIModel(next),
    });
  };

  const onTraitsChange = (partial: Partial<StoredModelTraits>) => {
    const reasoningLevel: ReasoningLevel | undefined = partial.effortLevel;
    void setTraitsMutation({
      id: projectId,
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
    if (!isOwner) return;
    void updateProject({
      id: projectId,
      providerAccountId: resolveAccountId(next) ?? null,
    });
  };

  const runtime = useChatRuntime({
    parentId: projectId,
    streamingEntityId: `project-chat-${projectId}`,
    questionEntityId: projectId,
    activeTurn: project?.activeTurn,
    legacyBusy:
      project?.activeTurn === undefined &&
      project?.activeChatWorkflowId !== undefined,
    submissionKey: [
      model,
      displayTraits.effortLevel ?? "",
      String(executionTraits.thinkingEnabled ?? ""),
      String(executionTraits.use1mContext ?? ""),
      providerAccountId ?? "",
    ].join("|"),
    submitAction: ({ turnId, content, attachmentStorageIds }) =>
      submitTurn({
        projectId,
        turnId,
        message: content,
        model,
        ...executionTraits,
        reasoningLevel:
          displayTraits.effortLevel ?? executionTraits.reasoningLevel,
        providerAccountId: resolveAccountId(providerAccountId),
        attachmentStorageIds,
      }),
    cancelAction: async (target) => {
      await cancelExecution({
        projectId,
        ...(target === undefined
          ? {}
          : target.kind === "pending"
            ? { turnId: target.turnId }
            : {
                turnId: target.turn.turnId,
                assistantMessageId: target.turn.assistantMessageId,
                attempt: target.turn.attempt,
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
        backgroundAgents={project?.backgroundAgents}
        onRequestStop={async (toolUseId) => {
          await requestStopBackgroundAgent({ projectId, toolUseId });
        }}
      />
      <ChatBody
        repoId={repo._id}
        repoBasePath={basePath}
        conversationId={projectId}
        messages={runtime.messages}
        queuedMessages={runtime.queuedMessages}
        pendingQueuedMessages={runtime.pendingQueuedMessages}
        activeTurn={project?.activeTurn}
        streaming={runtime.streaming ?? undefined}
        blockingQuestion={runtime.activeQuestion ?? undefined}
        localTurnId={runtime.localTurnId}
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
            : "Ask Eva anything... / for skills · @ to mention"
        }
        emptyStateTitle={
          isSandboxActive
            ? "Ask Eva anything about this project's running sandbox."
            : "Sandbox is inactive. Start it to begin chatting."
        }
        model={model}
        setModel={setModel}
        modelOptions={modelOptions}
        accounts={displayAccounts}
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
        optionsSubmenu={<ProjectChatOptionsSubmenu projectId={projectId} />}
      />
    </div>
  );
}
