import { api, normalizeAIModel, type Doc, type Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { ChatPageWrapper } from "@/lib/components/ChatPageWrapper";
import { ChatBody } from "@/lib/components/chat/ChatBody";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { ComposerPlanReadyBanner } from "./_components/ComposerPlanReadyBanner";
import { SessionOptionsMenu } from "./_components/SessionOptionsMenu";
import { BackgroundProcessesPanel } from "./_components/BackgroundProcessesPanel";
import { BackgroundAgentsChip } from "./_components/BackgroundAgentsChip";
import { SessionChatHeader } from "./_components/SessionChatHeader";
import { SessionModeDropdown } from "./_components/SessionModeDropdown";
import { SessionSummaryAccordion } from "./_components/SessionSummaryAccordion";
import { SessionSummaryModal } from "./_components/SessionSummaryModal";
import { SessionReviewModal } from "./_components/SessionReviewModal";
import {
  useSessionSend,
  type SessionMessage,
} from "./_components/useSessionSend";
import {
  useSessionSettings,
  type SessionMode,
} from "@/lib/hooks/useSessionSettings";
import { useSessionModel } from "@/lib/hooks/useSessionModel";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { useChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { PendingReviewCommentChips } from "@/lib/components/chat/PendingReviewCommentChips";
import { usePendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
import { getSessionReadOnlyMessage } from "./_utils/sessionReadOnly";

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
  onToggleSandbox?: () => void;
  /** Opens a file (by full sandbox path) in the File Viewer tab. */
  onOpenFile?: (path: string) => void;
  /** Opens the Diffs tab; optional repo-relative path scrolls to that file. */
  onViewDiff?: (repoRelativePath?: string) => void;
  /** Opens the PRD sandbox tab (used by the Plan Ready banner). */
  onOpenPrdTab?: () => void;
  backgroundAgents?: Doc<"sessions">["backgroundAgents"];
}

const AVAILABLE_MODES: SessionMode[] = ["edit", "plan"];

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
  onToggleSandbox,
  onOpenFile,
  onViewDiff,
  onOpenPrdTab,
  backgroundAgents,
}: ChatPanelProps) {
  const { repo, basePath } = useRepo();
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const session = useQuery(api.sessions.get, { id: sessionId });
  const defaultModel = normalizeAIModel(repo.defaultModel);
  const { options: accounts, resolveId: resolveAccountId } =
    useProviderAccounts();
  // Model + mode + traits + account are owned by Convex.
  const {
    model,
    setModel,
    mode: stickyMode,
    setMode: setStickyMode,
    traits,
    setTraits,
    providerAccountId: stickyProviderAccountId,
    setProviderAccountId: setStickyProviderAccountId,
  } = useSessionModel(sessionId, defaultModel);
  const {
    mode,
    setMode,
    displayTraits,
    executionTraits,
    onTraitsChange,
    providerAccountId,
    setProviderAccountId,
  } = useSessionSettings(sessionId, {
    defaultModel,
    model,
    onModelChange: setModel,
    mode: stickyMode,
    onModeChange: setStickyMode,
    traits,
    onTraitsPersist: setTraits,
    providerAccountId: stickyProviderAccountId,
    onProviderAccountChange: (next) => {
      setStickyProviderAccountId(
        next === null ? null : (resolveAccountId(next) ?? null),
      );
    },
  });
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);
  const currentUserId = useQuery(api.auth.me);
  const isOwner =
    currentUserId !== undefined &&
    session !== undefined &&
    session !== null &&
    currentUserId === (session.createdBy ?? session.userId);

  const draftSeed = useChatDraftSeed({
    kind: "sessionChat" as const,
    sessionId,
  });
  const draftBundle = draftSeed.isReady
    ? {
        target: { kind: "sessionChat" as const, sessionId },
        initialDisplay: draftSeed.initialDisplay,
        mentionMap: draftSeed.mentionMap,
        skillMap: draftSeed.skillMap,
      }
    : undefined;

  const review = usePendingReviewComments();
  const hasPendingReviewComments = (review?.comments.length ?? 0) > 0;

  useHotkey("Mod+Shift+Tab", (event) => {
    event.preventDefault();
    const currentIndex = AVAILABLE_MODES.indexOf(mode);
    const nextIndex = (currentIndex + 1) % AVAILABLE_MODES.length;
    setMode(AVAILABLE_MODES[nextIndex]);
  });

  const { isExecuting, handleSend, handleCancel } = useSessionSend({
    sessionId,
    mode,
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
    await answerPendingQuestion({
      entityId: sessionId,
      toolUseId,
      answer: JSON.stringify(answers),
    });
  };

  const hasSummary = Boolean(summary && summary.length > 0);
  const isStartupStreaming =
    isSandboxToggling && !isSandboxActive && !isSandboxStopping;

  const { headerLeft, headerRight } = SessionChatHeader({
    repoId: repo._id,
    sessionId,
    branchName,
    prUrl,
    prState,
    hasSummary,
    messageCount: messages.length,
    isSandboxActive,
    isSandboxToggling,
    deploymentStatus,
    sandboxCollapsed,
    onSandboxToggle,
    onToggleSandbox,
    onOpenSummaryModal: () => setShowSummaryModal(true),
    onOpenReviewModal: () => setShowReviewModal(true),
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
  // Compact card above composer only in plan mode with the sandbox collapsed.
  const showCompactPlanCard =
    mode === "plan" && hasPlanContent && sandboxCollapsed !== false;
  // When the card is hidden but a plan exists, show a slim Plan Ready strip.
  const showPlanReadyBanner = hasPlanContent && !showCompactPlanCard;

  const handleApprovePlan = () => {
    setMode("edit");
  };

  const handleViewPlan = () => {
    setMode("plan");
    if (sandboxCollapsed === false) {
      onOpenPrdTab?.();
    }
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
            transition={{ duration: 0.2 }}
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

  const toolsBefore = (
    <SessionModeDropdown mode={mode} onModeChange={setMode} />
  );
  const optionsSubmenu = <SessionOptionsMenu sessionId={sessionId} />;

  const emptyStateTitle = isSandboxActive
    ? "No messages yet. Start the conversation!"
    : isSandboxStopping
      ? "Stopping sandbox..."
      : isSandboxToggling
        ? "Starting sandbox..."
        : "Sandbox is inactive. Start the sandbox to begin chatting.";

  const placeholder = !isSandboxActive
    ? "Start the sandbox to begin chatting..."
    : mode === "plan"
      ? "Describe the product requirements... / for skills · @ for data"
      : "Ask Eva anything... / for skills · @ for data";

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
        isInputDisabled={!isSandboxActive}
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
        toolsBefore={toolsBefore}
        optionsSubmenu={optionsSubmenu}
        model={model}
        setModel={setModel}
        modelOptions={modelOptions}
        accounts={accounts}
        accountId={providerAccountId}
        onAccountChange={(next) => {
          if (!isOwner) return;
          setProviderAccountId(next);
        }}
        displayTraits={displayTraits}
        onTraitsChange={onTraitsChange}
        onSend={handleSend}
        onCancel={handleCancel}
        draft={draftBundle}
        isDraftLoading={!draftSeed.isReady}
        onOpenFile={onOpenFile}
        attachmentMode="sessionFiles"
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
    </ChatPageWrapper>
  );
}
