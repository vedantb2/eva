"use client";

import { useCallback } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useLocalStorage } from "usehooks-ts";
import {
  api,
  DEFAULT_AI_MODEL,
  findAIModelOption,
  normalizeAIModel,
  type AIModel,
  type Id,
} from "@conductor/backend";
import type { ResponseLength } from "@conductor/ui";
import {
  ChatBody,
  type ChatBodyQueuedMessage,
} from "@/lib/components/chat/ChatBody";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";

interface StoredSettings {
  model: AIModel;
  responseLength: ResponseLength;
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
  const { repo } = useRepo();
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
    { model: defaultModel, responseLength: "default" },
  );
  const model = normalizeAIModel(settings.model);
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);

  const setModel = useCallback(
    (next: AIModel) =>
      setSettings((prev) => ({ ...prev, model: normalizeAIModel(next) })),
    [setSettings],
  );
  const setResponseLength = useCallback(
    (next: ResponseLength) =>
      setSettings((prev) => ({ ...prev, responseLength: next })),
    [setSettings],
  );

  const lastMessage = messages?.[messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting =
    Boolean(project?.activeChatWorkflowId) || lastAssistantHasNoContent;

  const handleSend = useCallback(
    async (content: string) => {
      if (isExecuting) {
        await enqueueMessage({
          projectId,
          message: content,
          model,
          responseLength: settings.responseLength,
        });
        return;
      }
      await addMessage({ projectId, content });
      await startExecute({
        projectId,
        message: content,
        model,
        responseLength: settings.responseLength,
      });
    },
    [
      isExecuting,
      enqueueMessage,
      addMessage,
      startExecute,
      projectId,
      model,
      settings.responseLength,
    ],
  );

  const handleCancel = useCallback(async () => {
    await cancelExecution({ projectId });
  }, [cancelExecution, projectId]);

  const formatQueuedInfo = useCallback((msg: ChatBodyQueuedMessage) => {
    const parts = [
      msg.model ? findAIModelOption(msg.model).label : null,
      msg.responseLength && msg.responseLength !== "default"
        ? msg.responseLength
        : null,
    ].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(" / ") : undefined;
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col w-full">
      <ChatBody
        repoId={repo._id}
        repoOwner={repo.owner}
        repoName={repo.name}
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
        responseLength={settings.responseLength}
        setResponseLength={setResponseLength}
        onSend={handleSend}
        onCancel={handleCancel}
        formatQueuedInfo={formatQueuedInfo}
      />
    </div>
  );
}
