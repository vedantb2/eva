"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, normalizeAIModel, type Id } from "@conductor/backend";
import { toast } from "@conductor/ui";
import { IconBrandGithub } from "@tabler/icons-react";
import { ChatComposer } from "@/lib/components/chat/ChatComposer";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { repoDisplayLabel } from "@/lib/utils/repoGrouping";
import { SessionModeDropdown } from "./SessionModeDropdown";

/**
 * Shared landing composer for repo home and `/sessions`: branding + prompt,
 * create with the first message, then navigate while the sandbox boots.
 */
export function NewSessionComposer() {
  const navigate = useNavigate();
  const { repo, basePath } = useRepo();
  const logoUrl = useQuery(api.githubRepos.getLogoUrl, { repoId: repo._id });
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
    <div className="flex h-full items-center justify-center p-4 sm:p-6">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex min-w-0 items-center gap-3">
            <RepoLogo
              logoUrl={logoUrl}
              size={40}
              fallback={
                <IconBrandGithub
                  size={40}
                  className="shrink-0 text-muted-foreground"
                />
              }
            />
            <h1 className="truncate text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {repoDisplayLabel(repo)}
            </h1>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              What are we building?
            </h2>
            <p className="text-sm text-muted-foreground">
              Describe the task — Eva will start a session and title it for you.
            </p>
          </div>
        </div>
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
  );
}
