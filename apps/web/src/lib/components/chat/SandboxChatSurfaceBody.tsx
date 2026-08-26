"use client";

import type { ReactNode } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { usePendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
import { catchMutationError } from "@/lib/utils/mutationToast";
import { ChatBody } from "@/lib/components/chat/ChatBody";
import { SandboxChatPreInput } from "@/lib/components/chat/SandboxChatPreInput";
import { useChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import {
  chatEntityKeys,
  type SandboxChatSurface,
} from "@/lib/components/chat/sandboxChatSurface";

interface SandboxChatSurfaceBodyProps {
  surface: SandboxChatSurface;
  /** Pre-input slot above the compaction offer (session review chips, etc.). */
  preInputBeforeBanner?: ReactNode;
  /** Pre-input slot below the compaction offer (session plan card / strip). */
  preInputAfterBanner?: ReactNode;
  /** Slot above the conversation (session summary accordion). */
  preConversationContent?: ReactNode;
  /** Slot above the queued messages panel (session startup streaming). */
  beforeQueuedContent?: ReactNode;
  /** Replaces the default empty state when there are zero messages. */
  emptyStateOverride?: ReactNode;
  /** Overrides the default composer placeholder. */
  placeholder?: string;
  /** Overrides the default empty-state title. */
  emptyStateTitle?: string;
}

/**
 * The one `ChatBody` call site for sandbox chats. Everything that used to be
 * copied across the session, task, and project panels — the pending-question
 * round trip, the draft seed, the composer placeholders, the pre-input stack —
 * lives here; each surface supplies its handle plus its own slots.
 */
export function SandboxChatSurfaceBody({
  surface,
  preInputBeforeBanner,
  preInputAfterBanner,
  preConversationContent,
  beforeQueuedContent,
  emptyStateOverride,
  placeholder,
  emptyStateTitle,
}: SandboxChatSurfaceBodyProps) {
  const {
    entity,
    repoId,
    transcript,
    composerModel,
    isExecuting,
    isSwitchingAccount,
    sandboxRunning,
    isReadOnly,
    backgroundAgents,
    onSend,
    onCancel,
    openSandboxTab,
    onOpenFile,
    onViewDiff,
  } = surface;
  const { basePath } = useRepo();
  const { entityId, draftTarget } = chatEntityKeys(entity);

  const draftSeed = useChatDraftSeed(draftTarget);
  const draftBundle = draftSeed.isReady
    ? {
        target: draftTarget,
        initialDisplay: draftSeed.initialDisplay,
        mentionMap: draftSeed.mentionMap,
        skillMap: draftSeed.skillMap,
      }
    : undefined;

  // The same entity id the sandbox posts questions with (bare id, never the
  // streaming prefix).
  const activeQuestion = useQuery(api.pendingQuestions.getActive, { entityId });
  const answerPendingQuestion = useMutation(api.pendingQuestions.answer);
  const handleAnswerBlockingQuestion = async (
    toolUseId: string,
    answers: Record<string, string>,
  ) => {
    await catchMutationError(
      answerPendingQuestion({
        entityId,
        toolUseId,
        answer: JSON.stringify(answers),
      }),
      "Couldn't submit answer",
      `${entity.kind}-pending-answer`,
    );
  };

  // Only sessions mount the provider; elsewhere this is always empty.
  const review = usePendingReviewComments();
  const hasPendingContext = (review?.comments.length ?? 0) > 0;

  const resolvedPlaceholder =
    placeholder ??
    (!sandboxRunning
      ? "Wake Eva up to chat..."
      : isSwitchingAccount
        ? "Switching Claude account..."
        : "Ask Eva anything... / for skills · @ to mention");
  const resolvedEmptyStateTitle =
    emptyStateTitle ??
    (sandboxRunning
      ? "Ask Eva anything about this sandbox."
      : "Wake Eva up to begin chatting.");

  const onOpenAgentsTab =
    openSandboxTab === undefined ? undefined : () => openSandboxTab("agents");

  return (
    <ChatBody
      repoId={repoId}
      repoBasePath={basePath}
      conversationId={entityId}
      messages={transcript.messages}
      queuedMessages={transcript.queuedMessages}
      streamingActivity={transcript.streamingActivity}
      streamingContent={transcript.streamingContent}
      streamingPendingQuestion={transcript.streamingPendingQuestion}
      blockingQuestion={activeQuestion ?? undefined}
      onAnswerBlockingQuestion={handleAnswerBlockingQuestion}
      isExecuting={isExecuting}
      isInputDisabled={!sandboxRunning || isSwitchingAccount}
      isArchived={isReadOnly}
      placeholder={resolvedPlaceholder}
      emptyStateTitle={resolvedEmptyStateTitle}
      emptyStateOverride={emptyStateOverride}
      beforeQueuedContent={beforeQueuedContent}
      preConversationContent={preConversationContent}
      preInputContent={
        <SandboxChatPreInput
          surface={surface}
          beforeBanner={preInputBeforeBanner}
          afterBanner={preInputAfterBanner}
        />
      }
      model={composerModel.model}
      setModel={composerModel.setModel}
      modelOptions={composerModel.modelOptions}
      accounts={composerModel.accounts}
      accountId={composerModel.accountId}
      onAccountChange={composerModel.onAccountChange}
      displayTraits={composerModel.displayTraits}
      onTraitsChange={composerModel.onTraitsChange}
      onSend={onSend}
      onCancel={onCancel}
      draft={draftBundle}
      isDraftLoading={!draftSeed.isReady}
      onOpenFile={onOpenFile}
      onViewDiff={onViewDiff}
      hasPendingContext={hasPendingContext}
      onOpenAgentsTab={onOpenAgentsTab}
      backgroundAgents={backgroundAgents}
      sandboxRunning={sandboxRunning}
    />
  );
}
