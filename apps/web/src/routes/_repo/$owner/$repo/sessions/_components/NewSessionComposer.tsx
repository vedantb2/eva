"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api, normalizeAIModel, type Id } from "@conductor/backend";
import { toast } from "@conductor/ui";
import { ChatComposer } from "@/lib/components/chat/ChatComposer";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { SessionModeDropdown } from "./SessionModeDropdown";

/**
 * Landing composer for `/sessions`: create with the first message, then navigate
 * to the new session while the sandbox boots and the queue drains.
 */
export function NewSessionComposer() {
  const navigate = useNavigate();
  const { repo, basePath } = useRepo();
  const createSession = useMutation(api.sessions.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultModel = normalizeAIModel(repo.defaultModel);
  const {
    mode,
    setMode,
    model,
    setModel,
    displayTraits,
    executionTraits,
    onTraitsChange,
    providerAccountId,
    setProviderAccountId,
  } = useSessionSettings(`new-session-${repo._id}`, {
    defaultModel,
  });
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);
  const { options: accounts, resolveId: resolveAccountId } =
    useProviderAccounts();

  const handleSend = async (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => {
    setIsSubmitting(true);
    try {
      const { numId } = await createSession({
        repoId: repo._id,
        message: content,
        mode,
        model,
        ...executionTraits,
        providerAccountId: resolveAccountId(providerAccountId),
        attachmentStorageIds,
      });
      await navigate({ to: `${basePath}/sessions/${numId}` });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't create session";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            What are we building?
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe the task — Eva will start a session and title it for you.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <ChatComposer
            repoId={repo._id}
            repoBasePath={basePath}
            conversationId={`new-session-${repo._id}`}
            queuedMessages={[]}
            messageHistory={[]}
            isExecuting={false}
            isInputDisabled={isSubmitting}
            placeholder={
              mode === "plan"
                ? "Describe the product requirements... / for skills · @ for docs"
                : "Ask Eva anything... / for skills · @ for docs · attach images or HTML"
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
            onCancel={async () => {}}
            toolsBefore={
              <SessionModeDropdown mode={mode} onModeChange={setMode} />
            }
            attachmentMode="sessionFiles"
          />
        </div>
      </div>
    </div>
  );
}
