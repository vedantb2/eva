"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, normalizeAIModel, type Id } from "@conductor/backend";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { toast } from "@conductor/ui";
import { IconBrandGithub } from "@tabler/icons-react";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { ChatComposer } from "@/lib/components/chat/ChatComposer";
import { RepoLogo } from "@/lib/components/RepoLogo";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { defaultProviderAccountId } from "@/lib/utils/defaultProviderAccount";
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
  const [baseBranch, setBaseBranch] = useState(
    repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH,
  );

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
  const {
    options: accounts,
    resolveId: resolveAccountId,
    ready: accountsReady,
  } = useProviderAccounts();
  const [accountDefaulted, setAccountDefaulted] = useState(false);

  // Default account once the provider list is ready. Runs in an effect because
  // setProviderAccountId writes to localStorage, which dispatches a sync event —
  // doing that during render triggers React's event-handler-in-render error.
  useEffect(() => {
    if (accountsReady && !accountDefaulted) {
      setProviderAccountId(defaultProviderAccountId(accounts, model));
      setAccountDefaulted(true);
    }
  }, [accountsReady, accountDefaulted, accounts, model, setProviderAccountId]);

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
        baseBranch,
        ...executionTraits,
        // Snapshot resolved display traits (including model defaults) so the
        // new session's sticky Convex fields match the landing composer.
        reasoningLevel: displayTraits.effortLevel,
        thinkingEnabled: displayTraits.thinkingEnabled,
        use1mContext: displayTraits.use1mContext,
        providerAccountId: resolveAccountId(providerAccountId) ?? null,
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
        <div className="space-y-1.5 text-center">
          <h1 className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            <span>What are we building for</span>
            <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-primary">
              <RepoLogo
                logoUrl={logoUrl}
                size={28}
                fallback={
                  <IconBrandGithub
                    size={28}
                    className="shrink-0 text-muted-foreground"
                  />
                }
              />
              <span className="truncate">{repoDisplayLabel(repo)}</span>
            </span>
            <span>?</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe the task — Eva will start a session and title it for you.
          </p>
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
              : "Ask Eva anything... / for skills · @ for docs"
          }
          model={model}
          setModel={(next) => {
            setModel(next);
            setProviderAccountId(defaultProviderAccountId(accounts, next));
          }}
          modelOptions={modelOptions}
          accounts={accounts}
          accountId={providerAccountId}
          onAccountChange={setProviderAccountId}
          displayTraits={displayTraits}
          onTraitsChange={onTraitsChange}
          onSend={handleSend}
          onCancel={async () => {}}
          toolsBefore={
            <>
              <SessionModeDropdown mode={mode} onModeChange={setMode} />
              <BranchSelect
                value={baseBranch}
                onValueChange={setBaseBranch}
                placeholder="Select a base branch"
                className="h-8 w-auto max-w-[200px]"
                disabled={isSubmitting}
              />
            </>
          }
          attachmentMode="sessionFiles"
        />
      </div>
    </div>
  );
}
