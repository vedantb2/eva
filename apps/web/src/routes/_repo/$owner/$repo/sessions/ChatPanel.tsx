import { api, normalizeAIModel, type Doc, type Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { ChatPageWrapper } from "@/lib/components/ChatPageWrapper";
import { ChatBody } from "@/lib/components/chat/ChatBody";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { ComposerPlanReadyBanner } from "./_components/ComposerPlanReadyBanner";
import { BackgroundProcessesPanel } from "./_components/BackgroundProcessesPanel";
import { BackgroundAgentsChip } from "./_components/BackgroundAgentsChip";
import { SessionChatHeader } from "./_components/SessionChatHeader";
import { SessionSummaryAccordion } from "./_components/SessionSummaryAccordion";
import { SessionSummaryModal } from "./_components/SessionSummaryModal";
import { SessionReviewModal } from "./_components/SessionReviewModal";
import {
  useSessionSend,
  type SessionMessage,
} from "./_components/useSessionSend";
import { catchMutationError } from "@/lib/utils/mutationToast";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import { useSessionModel } from "@/lib/hooks/useSessionModel";
import {
  useAvailableAiModels,
  useSessionOwnerProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { useChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { useSeedChatDraft } from "@/lib/components/chat/useSeedChatDraft";
import { PendingReviewCommentChips } from "@/lib/components/chat/PendingReviewCommentChips";
import { AveResetChatDialog } from "@/lib/components/ave/AveResetChatDialog";
import { usePendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
import { getSessionReadOnlyMessage } from "./_utils/sessionReadOnly";
import { APPROVE_PLAN_PROMPT } from "./_utils/composerPrompts";
import { motionBase } from "@eva/ui";

type QueuedSessionMessage = NonNullable<
  FunctionReturnType<typeof api.queuedMessages.listByParent>
>[number];

interface ChatPanelProps {
  sessionId: Id<"sessions">;
  title: string;
  branchName?: string;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
  summary?: string[];
  messages: SessionMessage[];
  queuedMessages: QueuedSessionMessage[];
  planContent?: string;
  streamingActivity?: string;
  streamingContent?: string;
  streamingPendingQuestion?: string;
  summaryStreamingActivity?: string;
  startupStreamingActivity?: string;
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  /** True while status is stopping / stop mutation in flight — not a start. */
  isSandboxStopping?: boolean;
  onSandboxToggle: (action: "start" | "stop") => void;
  isArchived?: boolean;
  /** Archive or PR merged/closed — hides composer and shows read-only banner. */
  isReadOnly?: boolean;
  deploymentStatus?: "queued" | "building" | "deployed" | "error";
  sandboxCollapsed?: boolean;
  /** Canonical link to this session; omitted when the URL already is one. */
  permalinkPath?: string;
  /** Chat-only surface (the orchestrator): hides branch/PR affordances. */
  chatOnly?: boolean;
  /** Popover already titles the surface — omit the session-chat title. */
  hideTitle?: boolean;
  onToggleSandbox?: () => void;
  /** Opens a file (by full sandbox path) in the File Viewer tab. */
  onOpenFile?: (path: string) => void;
  /** Opens the Diffs tab; optional repo-relative path scrolls to that file. */
  onViewDiff?: (repoRelativePath?: string) => void;
  /** Opens the PRD sandbox tab (used by the Plan Ready banner). */
  onOpenPrdTab?: () => void;
  backgroundAgents?: Doc<"sessions">["backgroundAgents"];
}

export function ChatPanel({
  sessionId,
  title,
  branchName,
  prUrl,
  prState,
  summary,
  messages,
  queuedMessages,
  planContent,
  streamingActivity,
  streamingContent,
  streamingPendingQuestion,
  summaryStreamingActivity,
  startupStreamingActivity,
  isSandboxActive,
  isSandboxToggling,
  isSandboxStopping = false,
  onSandboxToggle,
  isArchived = false,
  isReadOnly = false,
  deploymentStatus,
  sandboxCollapsed,
  permalinkPath,
  chatOnly,
  hideTitle = false,
  onToggleSandbox,
  onOpenFile,
  onViewDiff,
  onOpenPrdTab,
  backgroundAgents,
}: ChatPanelProps) {
  const { repo, basePath } = useRepo();
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showResetChatDialog, setShowResetChatDialog] = useState(false);

  const defaultModel = normalizeAIModel(repo.defaultModel);
  // The picker lists the session owner's accounts, not the viewer's — the turn
  // always runs on the owner's credentials.
  const { options: accounts, resolveId: resolveAccountId } =
    useSessionOwnerProviderAccounts(sessionId);
  // Model + traits + account are owned by Convex.
  const {
    model,
    setModel,
    traits,
    setTraits,
    providerAccountId: stickyProviderAccountId,
    setProviderAccountId: setStickyProviderAccountId,
    isSwitchingAccount,
  } = useSessionModel(sessionId, defaultModel);
  const {
    displayTraits,
    executionTraits,
    onTraitsChange,
    providerAccountId,
    setProviderAccountId,
  } = useSessionSettings({
    defaultModel,
    model,
    onModelChange: setModel,
    traits,
    onTraitsPersist: setTraits,
    providerAccountId: stickyProviderAccountId,
    onProviderAccountChange: (next: string | null) => {
      setStickyProviderAccountId(
        next === null ? null : (resolveAccountId(next) ?? null),
      );
    },
  });
  // Every visible model, across providers: a session may be moved onto another
  // provider mid-conversation, and each pick carries the account it was made
  // under so credentials follow the new provider.
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);

  const draftTarget = { kind: "sessionChat" as const, sessionId };
  const draftSeed = useChatDraftSeed(draftTarget);
  const seedChatDraft = useSeedChatDraft(draftTarget);
  const draftBundle = draftSeed.isReady
    ? {
        target: draftTarget,
        initialDisplay: draftSeed.initialDisplay,
        mentionMap: draftSeed.mentionMap,
        skillMap: draftSeed.skillMap,
      }
    : undefined;

  const review = usePendingReviewComments();
  const hasPendingReviewComments = (review?.comments.length ?? 0) > 0;

  const { isExecuting, handleSend, handleCancel } = useSessionSend({
    sessionId,
    model,
    executionTraits,
    reasoningLevel: displayTraits.effortLevel,
    providerAccountId,
    resolveAccountId,
    accounts,
    messages,
  });

  const activeQuestion = useQuery(api.pendingQuestions.getActive, {
    entityId: sessionId,
  });
  const answerPendingQuestion = useMutation(api.pendingQuestions.answer);
  const handleAnswerBlockingQuestion = async (
    toolUseId: string,
    answers: Record<string, string>,
  ) => {
    await catchMutationError(
      answerPendingQuestion({
        entityId: sessionId,
        toolUseId,
        answer: JSON.stringify(answers),
      }),
      "Couldn't submit answer",
      "session-pending-answer",
    );
  };

  // Plan usage belongs to the credential this session runs on. The sticky value
  // is undefined until the session document lands, and passing no scope then
  // keeps the indicator hidden rather than briefly showing the team
  // credential's numbers under a "Team" heading it is about to replace.
  const usageAccountScope =
    stickyProviderAccountId === undefined
      ? undefined
      : {
          providerAccountId: stickyProviderAccountId,
          accountLabel:
            stickyProviderAccountId === null
              ? "Team"
              : (accounts.find(
                  (account) => account.id === stickyProviderAccountId,
                )?.label ?? "Selected account"),
        };

  const hasSummary = Boolean(summary && summary.length > 0);
  const isStartupStreaming =
    isSandboxToggling && !isSandboxActive && !isSandboxStopping;

  const { headerLeft, headerRight } = SessionChatHeader({
    repoId: repo._id,
    sessionId,
    title,
    branchName,
    prUrl,
    prState,
    hasSummary,
    messageCount: messages.length,
    isSandboxActive,
    isSandboxToggling,
    isAssistantResponding: isExecuting,
    deploymentStatus,
    sandboxCollapsed,
    permalinkPath,
    chatOnly,
    hideTitle,
    usageAccountScope,
    onSandboxToggle,
    onToggleSandbox,
    onOpenSummaryModal: () => setShowSummaryModal(true),
    onOpenReviewModal: () => setShowReviewModal(true),
    // Only Manager Ave can be reset: it is the one chat the user cannot simply
    // replace by opening a new session.
    onOpenResetChatDialog: chatOnly
      ? () => setShowResetChatDialog(true)
      : undefined,
  });

  const startupStreamingNode = (
    <div className="rounded-surface bg-secondary p-4">
      <StreamingActivityDisplay
        activity={startupStreamingActivity}
        thinkingLabel="Starting sandbox..."
      />
    </div>
  );

  const emptyStateOverride = isStartupStreaming ? (
    <div className="flex flex-col items-center justify-center py-8">
      <StreamingActivityDisplay
        activity={startupStreamingActivity}
        thinkingLabel="Starting sandbox..."
      />
    </div>
  ) : null;

  const beforeQueuedContent = isStartupStreaming ? startupStreamingNode : null;

  const hasPlanContent =
    typeof planContent === "string" && planContent.trim().length > 0;
  // Compact card above the composer only while the sandbox pane is collapsed —
  // otherwise the PRD tab owns the plan and the slim strip links to it.
  const showCompactPlanCard = hasPlanContent && sandboxCollapsed !== false;
  // When the card is hidden but a plan exists, show a slim Plan Ready strip.
  const showPlanReadyBanner = hasPlanContent && !showCompactPlanCard;

  const handleApprovePlan = () => {
    void seedChatDraft(APPROVE_PLAN_PROMPT);
  };

  const handleViewPlan = () => {
    onOpenPrdTab?.();
  };

  const preInputContent = (
    <>
      <BackgroundAgentsChip
        sessionId={sessionId}
        backgroundAgents={backgroundAgents}
        isReadOnly={isReadOnly}
      />
      <BackgroundProcessesPanel sessionId={sessionId} />
      <PendingReviewCommentChips />
      {showCompactPlanCard && planContent ? (
        <AnimatePresence initial={false}>
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={motionBase}
          >
            <SessionPrdPlanView
              sessionId={sessionId}
              planContent={planContent}
              onApprovePlan={handleApprovePlan}
              variant="compact"
              isArchived={isReadOnly}
            />
          </m.div>
        </AnimatePresence>
      ) : null}
      {showPlanReadyBanner && planContent ? (
        <ComposerPlanReadyBanner
          planContent={planContent}
          onViewPlan={handleViewPlan}
          onApprovePlan={handleApprovePlan}
          isArchived={isReadOnly}
        />
      ) : null}
    </>
  );

  const emptyStateTitle = isSandboxActive
    ? "No messages yet. Start the conversation!"
    : isSandboxStopping
      ? "Stopping sandbox..."
      : isSandboxToggling
        ? "Starting sandbox..."
        : "Wake Eva up to begin chatting.";

  const placeholder = !isSandboxActive
    ? "Wake Eva up to begin chatting..."
    : isSwitchingAccount
      ? "Switching Claude account..."
      : "Ask Eva anything... / for skills · @ to mention";

  const readOnlyMessage = getSessionReadOnlyMessage({
    isArchived,
    prState,
  });

  return (
    <ChatPageWrapper
      title={title}
      readOnlyMessage={readOnlyMessage}
      headerLeft={headerLeft}
      headerRight={headerRight}
    >
      <ChatBody
        repoId={repo._id}
        repoBasePath={basePath}
        conversationId={sessionId}
        messages={messages}
        queuedMessages={queuedMessages}
        streamingActivity={streamingActivity}
        streamingContent={streamingContent}
        streamingPendingQuestion={streamingPendingQuestion}
        blockingQuestion={activeQuestion ?? undefined}
        onAnswerBlockingQuestion={handleAnswerBlockingQuestion}
        isExecuting={isExecuting}
        isInputDisabled={!isSandboxActive || isSwitchingAccount}
        isArchived={isReadOnly}
        placeholder={placeholder}
        emptyStateTitle={emptyStateTitle}
        emptyStateOverride={emptyStateOverride}
        beforeQueuedContent={beforeQueuedContent}
        preInputContent={preInputContent}
        preConversationContent={
          <SessionSummaryAccordion
            summary={summary}
            summaryStreamingActivity={summaryStreamingActivity}
          />
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
        onCancel={handleCancel}
        draft={draftBundle}
        isDraftLoading={!draftSeed.isReady}
        onOpenFile={onOpenFile}
        onViewDiff={prUrl ? onViewDiff : undefined}
        hasPendingContext={hasPendingReviewComments}
      />
      <SessionSummaryModal
        sessionId={sessionId}
        hasSummary={hasSummary}
        open={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
      />
      <SessionReviewModal
        sessionId={sessionId}
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      />
      {chatOnly && (
        <AveResetChatDialog
          open={showResetChatDialog}
          onOpenChange={setShowResetChatDialog}
        />
      )}
    </ChatPageWrapper>
  );
}
