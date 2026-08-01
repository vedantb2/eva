"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import {
  api,
  buildTraitsExecutionPayload,
  normalizeAIModel,
  resolveTraitsForDisplay,
  type Id,
} from "@eva/backend";
import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";
import { toast } from "@eva/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { ChatComposer } from "@/lib/components/chat/ChatComposer";
import { tokenizedToEditable } from "@/lib/components/mentions";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { useNewSessionComposerState } from "@/lib/hooks/useNewSessionComposerState";
import { defaultProviderAccountId } from "@/lib/utils/defaultProviderAccount";
import { ComposerAppSwitcher } from "./ComposerAppSwitcher";
import { SessionModeDropdown } from "./SessionModeDropdown";
import { SessionDesignComposerTools } from "./SessionDesignComposerTools";

/**
 * Shared landing composer for repo home and `/sessions`: branding + prompt,
 * base-branch picker under the composer, create with the first message, then
 * navigate while the sandbox boots.
 */
export function NewSessionComposer() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { repo, basePath } = useRepo();
  const firstName = user?.firstName?.trim();
  const createSession = useMutation(api.sessions.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [baseBranch, setBaseBranch] = useState(
    repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH,
  );

  const defaultModel = normalizeAIModel(repo.defaultModel);
  const {
    draft: draftTokenized,
    mode,
    setMode,
    model,
    setModel,
    storedTraits,
    onTraitsChange,
    providerAccountId,
    setProviderAccountId,
    setDraft,
    clearDraft,
    numDesigns,
    setNumDesigns,
  } = useNewSessionComposerState(repo._id, defaultModel);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<Id<"designPersonas">>();
  const {
    displayText: draftDisplay,
    mentionMap: draftMentionMap,
    skillMap: draftSkillMap,
  } = tokenizedToEditable(draftTokenized);

  const {
    options: accounts,
    resolveId: resolveAccountId,
    ready: accountsReady,
  } = useProviderAccounts();
  const resolvedProviderAccountId = resolveAccountId(providerAccountId);
  const { options: modelOptions, providerCapabilities } = useAvailableAiModels(
    repo._id,
    model,
    resolvedProviderAccountId,
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
    // Resolved before the try: React Compiler bails on the whole file when a
    // nullish-coalescing expression sits inside a try/catch.
    const accountId = resolvedProviderAccountId ?? null;
    const designArgs =
      mode === "design" ? { personaId: selectedPersonaId, numDesigns } : {};
    try {
      const { numId } = await createSession({
        repoId: repo._id,
        message: content,
        mode,
        model,
        baseBranch,
        ...executionTraits,
        ...designArgs,
        // Snapshot resolved display traits (including model defaults) so the
        // new session's sticky Convex fields match the landing composer.
        reasoningLevel: displayTraits.effortLevel,
        thinkingEnabled: displayTraits.thinkingEnabled,
        use1mContext: displayTraits.use1mContext,
        providerAccountId: accountId,
        attachmentStorageIds,
      });
      clearDraft();
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
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <h1 className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <span>
            {firstName
              ? `${firstName}, what are we building for`
              : "What are we building for"}
          </span>
          <ComposerAppSwitcher />
          <span>?</span>
        </h1>
        <ChatComposer
          repoId={repo._id}
          repoBasePath={basePath}
          conversationId={`new-session-${repo._id}`}
          queuedMessages={[]}
          pendingQueuedMessages={[]}
          messageHistory={[]}
          isExecuting={false}
          isInputDisabled={isSubmitting}
          placeholder={
            mode === "plan"
              ? "Describe what to plan... / for skills · @ for data"
              : mode === "design"
                ? "Describe the UI to design... / for skills · @ for data"
                : "Ask Eva anything... / for skills · @ for data"
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
          providerCapabilities={providerCapabilities}
          onTraitsChange={onTraitsChange}
          onSend={handleSend}
          onCancel={async () => {}}
          toolsBefore={
            <>
              <SessionModeDropdown mode={mode} onModeChange={setMode} />
              {mode === "design" ? (
                <SessionDesignComposerTools
                  repoId={repo._id}
                  personaId={selectedPersonaId}
                  onPersonaChange={setSelectedPersonaId}
                  numDesigns={numDesigns}
                  onNumDesignsChange={setNumDesigns}
                  disabled={isSubmitting}
                />
              ) : null}
            </>
          }
          localDraft={{
            initialDisplay: draftDisplay,
            mentionMap: draftMentionMap,
            skillMap: draftSkillMap,
            onSave: setDraft,
          }}
          attachmentMode="sessionFiles"
          underCardLeading={
            <BranchSelect
              value={baseBranch}
              onValueChange={setBaseBranch}
              placeholder="Select a branch"
              className="h-7 w-auto max-w-full justify-start border-0 bg-transparent px-2 text-xs font-normal text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              disabled={isSubmitting}
            />
          }
        />
      </div>
    </div>
  );
}
