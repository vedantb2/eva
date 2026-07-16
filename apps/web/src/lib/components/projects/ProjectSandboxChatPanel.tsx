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
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";

interface StoredSettings {
  model: AIModel;
  reasoningLevel: ReasoningLevel;
}

function chatSettingsKey(parentId: string) {
  return `conductor:chat-settings:${parentId}`;
}

interface ProjectSandboxChatPanelProps {
  projectId: Id<"projects">;
  isSandboxActive: boolean;
}

export function ProjectSandboxChatPanel({
  projectId,
  isSandboxActive,
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

  const defaultModel = normalizeAIModel(repo.defaultModel ?? DEFAULT_AI_MODEL);
  const [settings, setSettings] = useLocalStorage<StoredSettings>(
    chatSettingsKey(projectId),
    { model: defaultModel, reasoningLevel: DEFAULT_REASONING_LEVEL },
  );
  const model = normalizeAIModel(settings.model);
  const reasoningLevel = settings.reasoningLevel ?? DEFAULT_REASONING_LEVEL;
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);

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

  const lastMessage = messages?.[messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting =
    Boolean(project?.activeChatWorkflowId) || lastAssistantHasNoContent;

  const handleSend = useCallback(
    async (content: string, attachmentStorageIds?: Id<"_storage">[]) => {
      if (isExecuting) {
        await enqueueMessage({
          projectId,
          message: content,
          model,
          reasoningLevel,
          attachmentStorageIds,
        });
        return;
      }
      await addMessage({ projectId, content, attachmentStorageIds });
      await startExecute({
        projectId,
        message: content,
        model,
        reasoningLevel,
      });
    },
    [
      isExecuting,
      enqueueMessage,
      addMessage,
      startExecute,
      projectId,
      model,
      reasoningLevel,
    ],
  );

  const handleCancel = useCallback(async () => {
    await cancelExecution({ projectId });
  }, [cancelExecution, projectId]);

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
        conversationId={projectId}
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
            : "Ask Eva about the running project..."
        }
        emptyStateTitle={
          isSandboxActive
            ? "Ask Eva anything about this project's running sandbox."
            : "Sandbox is inactive. Start it to begin chatting."
        }
        model={model}
        setModel={setModel}
        modelOptions={modelOptions}
        reasoningLevel={reasoningLevel}
        onReasoningLevelChange={setReasoningLevel}
        onSend={handleSend}
        onCancel={handleCancel}
        formatQueuedInfo={formatQueuedInfo}
      />
    </div>
  );
}
