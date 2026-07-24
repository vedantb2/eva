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
} from "@conductor/backend";
import { ChatBody } from "@/lib/components/chat/ChatBody";
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
  const messages = useQuery(api.messages.listByParent, { parentId: projectId });
  const queuedMessages = useQuery(api.queuedMessages.listByParent, {
    parentId: projectId,
  });
  const streaming = useQuery(api.streaming.get, {
    entityId: `project-chat-${projectId}`,
  });

  const addMessage = useMutation(api.projectChatWorkflow.addMessage);
  const startExecute = useMutation(api.projectChatWorkflow.startExecute);
  const enqueueMessage = useMutation(api.projectChatWorkflow.enqueueMessage);
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
  const displayTraits = resolveTraitsForDisplay(model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(model, storedTraits);
  const providerAccountId = project?.providerAccountId ?? null;
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);
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

  // Same entityId the project-chat sandbox posts with (project id, not stream prefix).
  const activeQuestion = useQuery(api.pendingQuestions.getActive, {
    entityId: projectId,
  });
  const answerPendingQuestion = useMutation(api.pendingQuestions.answer);
  const handleAnswerBlockingQuestion = async (
    toolUseId: string,
    answers: Record<string, string>,
  ) => {
    await answerPendingQuestion({
      entityId: projectId,
      toolUseId,
      answer: JSON.stringify(answers),
    });
  };

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

  const lastMessage = messages?.[messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting =
    Boolean(project?.activeChatWorkflowId) || lastAssistantHasNoContent;

  const handleSend = async (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => {
    if (isExecuting) {
      await enqueueMessage({
        projectId,
        message: content,
        model,
        ...executionTraits,
        reasoningLevel:
          displayTraits.effortLevel ?? executionTraits.reasoningLevel,
        providerAccountId: resolveAccountId(providerAccountId),
        attachmentStorageIds,
      });
      return;
    }
    const accountId = resolveAccountId(providerAccountId);
    await addMessage({
      projectId,
      content,
      attachmentStorageIds,
      providerAccountId: accountId,
      model,
      reasoningLevel: displayTraits.effortLevel,
    });
    await startExecute({
      projectId,
      message: content,
      model,
      ...executionTraits,
      providerAccountId: accountId,
    });
  };

  const handleCancel = async () => {
    await cancelExecution({ projectId });
  };

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
            : "Ask Eva anything... / for skills · @ for data"
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
        onTraitsChange={onTraitsChange}
        onSend={handleSend}
        onCancel={handleCancel}
        draft={draftBundle}
        isDraftLoading={!draftSeed.isReady}
        onOpenFile={onOpenFile}
        optionsSubmenu={<ProjectChatOptionsSubmenu projectId={projectId} />}
      />
    </div>
  );
}
