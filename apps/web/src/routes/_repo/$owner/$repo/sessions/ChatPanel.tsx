import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Button,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@conductor/ui";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCode,
  IconClipboardList,
  IconGitPullRequest,
  IconBrandVercel,
  IconSparkles,
  IconSend,
  IconCircleCheck,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconDots,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import {
  api,
  findAIModelOption,
  normalizeAIModel,
  type AIModel,
} from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { FunctionReturnType } from "convex/server";
import { ChatPageWrapper } from "@/lib/components/ChatPageWrapper";
import {
  ChatBody,
  type ChatBodyQueuedMessage,
  type PendingUserMessage,
} from "@/lib/components/chat/ChatBody";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { prStateIconClass } from "./_utils/-prStateIconClass";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { useChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";

type SessionMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];
type QueuedSessionMessage = NonNullable<
  FunctionReturnType<typeof api.queuedMessages.listByParent>
>[number];

const REVIEW_AUDITS = [
  "Running code audits",
  "Analyzing results",
  "Generating report",
];

const SESSION_MODE_OPTIONS: Array<{
  value: SessionMode;
  label: string;
  icon: typeof IconCode;
}> = [
  { value: "edit", label: "Edit", icon: IconCode },
  { value: "plan", label: "PRD", icon: IconClipboardList },
];

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
  onSandboxToggle: (action: "start" | "stop") => void;
  isArchived?: boolean;
  deploymentStatus?: "queued" | "building" | "deployed" | "error";
  sandboxCollapsed?: boolean;
  onToggleSandbox?: () => void;
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
  onSandboxToggle,
  isArchived,
  deploymentStatus,
  sandboxCollapsed,
  onToggleSandbox,
}: ChatPanelProps) {
  const { repo, basePath } = useRepo();
  // User messages shown optimistically until the reactive query delivers the
  // matching server row (deduped by clientId). See handleSend below.
  const [pendingMessages, setPendingMessages] = useState<PendingUserMessage[]>(
    [],
  );
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [reviewStep, setReviewStep] = useState<
    "confirm" | "auditing" | "complete"
  >("confirm");
  const [completedAudits, setCompletedAudits] = useState(0);

  const defaultModel = normalizeAIModel(repo.defaultModel);
  const { mode, setMode, model, setModel } = useSessionSettings(sessionId, {
    defaultModel,
  });
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);

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

  const AVAILABLE_MODES: SessionMode[] = ["edit", "plan"];
  useHotkey("Mod+Shift+Tab", (e) => {
    e.preventDefault();
    const currentIndex = AVAILABLE_MODES.indexOf(mode);
    const nextIndex = (currentIndex + 1) % AVAILABLE_MODES.length;
    setMode(AVAILABLE_MODES[nextIndex]);
  });

  const startSummarize = useMutation(api.summarizeWorkflow.startSummarize);
  const addMessage = useMutation(api.sessions.addMessage);
  const startExecution = useMutation(api.sessionWorkflow.startExecute);
  const enqueueMessage = useMutation(api.sessionWorkflow.enqueueMessage);
  const cancelExecutionMutation = useMutation(
    api.sessionWorkflow.cancelExecution,
  );
  const createPr = useAction(api.github.createSessionPr);
  const startAuditMutation = useMutation(api.audits.startSessionAudit);
  const sessionAudit = useQuery(
    api.audits.getBySession,
    reviewStep === "auditing" ? { sessionId } : "skip",
  );

  const lastMessage = messages[messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting = lastAssistantHasNoContent;

  const handleSend = useCallback(
    async (content: string) => {
      if (isExecuting) {
        await enqueueMessage({
          sessionId,
          message: content,
          mode,
          model,
        });
        return;
      }

      // Optimistic send: show the user message + a working bubble instantly.
      // The clientId lets the eventual server row dedup against this pending
      // one, so it swaps in without a flicker. We fire the mutations WITHOUT
      // awaiting them so this callback resolves synchronously — that lets the
      // composer clear immediately (PromptInput clears only after onSend
      // resolves) and keeps the UI responsive before any server round-trip.
      const clientId = crypto.randomUUID();
      setPendingMessages((prev) => [
        ...prev,
        { clientId, content, mode, createdAt: Date.now() },
      ]);

      const dropPending = () =>
        setPendingMessages((prev) =>
          prev.filter((p) => p.clientId !== clientId),
        );

      void Promise.all([
        addMessage({ id: sessionId, role: "user", content, mode, clientId }),
        startExecution({ sessionId, message: content, mode, model }),
      ]).catch(async (error) => {
        dropPending();
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send message";
        await addMessage({
          id: sessionId,
          role: "assistant",
          content: `Error: ${errorMessage}`,
          mode,
        });
      });
    },
    [
      isExecuting,
      enqueueMessage,
      addMessage,
      startExecution,
      sessionId,
      mode,
      model,
    ],
  );

  // Prune optimistic messages once their server row (same clientId) has been
  // delivered by the reactive query, so pendingMessages does not grow.
  useEffect(() => {
    if (pendingMessages.length === 0) return;
    const deliveredClientIds = new Set(
      messages
        .map((m) => m.clientId)
        .filter((id): id is string => id !== undefined),
    );
    if (pendingMessages.some((p) => deliveredClientIds.has(p.clientId))) {
      setPendingMessages((prev) =>
        prev.filter((p) => !deliveredClientIds.has(p.clientId)),
      );
    }
  }, [messages, pendingMessages]);

  const handleCancel = useCallback(async () => {
    await cancelExecutionMutation({ sessionId });
  }, [cancelExecutionMutation, sessionId]);

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      await startSummarize({ sessionId });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCreatePr = async () => {
    setReviewStep("auditing");
    setCompletedAudits(0);
    setIsCreatingPr(true);
    try {
      await createPr({ sessionId });
      try {
        await startAuditMutation({ sessionId });
      } catch {
        setReviewStep("complete");
      }
    } catch {
      setReviewStep("confirm");
    } finally {
      setIsCreatingPr(false);
    }
  };

  const handleReviewModalClose = () => {
    setShowReviewModal(false);
    setReviewStep("confirm");
    setCompletedAudits(0);
  };

  useEffect(() => {
    if (reviewStep !== "auditing") return;
    const status = sessionAudit?.status;
    if (status !== "completed" && status !== "error") return;
    const timers = REVIEW_AUDITS.map((_, i) =>
      setTimeout(() => setCompletedAudits((prev) => prev + 1), (i + 1) * 400),
    );
    return () => timers.forEach(clearTimeout);
  }, [sessionAudit?.status, reviewStep]);

  useEffect(() => {
    if (reviewStep === "auditing" && completedAudits >= REVIEW_AUDITS.length) {
      const timer = setTimeout(() => setReviewStep("complete"), 300);
      return () => clearTimeout(timer);
    }
  }, [reviewStep, completedAudits]);

  const formatQueuedInfo = useCallback(
    (message: ChatBodyQueuedMessage): string | undefined => {
      const modeLabel = message.mode === "plan" ? "PRD" : "Edit";
      const detailParts = [
        modeLabel,
        message.model ? findAIModelOption(message.model).label : null,
      ].filter((part): part is string => Boolean(part));
      return detailParts.length > 0 ? detailParts.join(" / ") : undefined;
    },
    [],
  );

  const hasSummary = Boolean(summary && summary.length > 0);
  const showSummaryStreaming = Boolean(summaryStreamingActivity);
  const isStartupStreaming =
    isSandboxToggling && !isSandboxActive && Boolean(startupStreamingActivity);

  const selectedModeOption =
    SESSION_MODE_OPTIONS.find((option) => option.value === mode) ??
    SESSION_MODE_OPTIONS[0];
  const SelectedModeIcon = selectedModeOption.icon;

  const headerLeft = (
    <Button
      size="icon"
      variant={isSandboxActive ? "destructive" : "secondary"}
      onClick={() => onSandboxToggle(isSandboxActive ? "stop" : "start")}
      disabled={isSandboxToggling}
      className={`motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.96] ${isSandboxActive ? "" : "text-success"}`}
    >
      {isSandboxToggling ? (
        <Spinner size="sm" />
      ) : isSandboxActive ? (
        <IconPlayerStop className="w-4 h-4" />
      ) : (
        <IconPlayerPlay className="w-4 h-4" />
      )}
    </Button>
  );

  const headerRight = (
    <>
      <EntityContextUsage repoId={repo._id} entityId={sessionId} />
      {/* Show while PR is missing or still in draft. Treat unset prState as
          draft for legacy sessions created before prState tracking existed. */}
      {branchName && (!prState || prState === "draft") && (
        <Button
          size="sm"
          variant="secondary"
          className="motion-press text-success hover:scale-[1.01] active:scale-[0.96]"
          onClick={() => setShowReviewModal(true)}
        >
          <IconSend size={12} />
          <span className="hidden sm:inline">Send for Review</span>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            className="motion-press hover:scale-[1.01] active:scale-[0.96]"
          >
            More
            <IconDots size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowSummaryModal(true)}
            disabled={
              isSummarizing || !isSandboxActive || messages.length === 0
            }
          >
            <IconSparkles size={14} />
            {hasSummary ? "Regenerate Summary" : "Summarise Session"}
          </DropdownMenuItem>
          {deploymentStatus && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem disabled>
                    <IconBrandVercel size={14} />
                    View Preview
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Please start sandbox and view changes through the preview tab
                there instead
              </TooltipContent>
            </Tooltip>
          )}
          {prUrl && (
            <DropdownMenuItem
              onClick={() => {
                window.open(prUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <IconGitPullRequest
                size={14}
                className={prStateIconClass(prState)}
              />
              View PR
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {onToggleSandbox && (
        <Button
          size="icon"
          variant="ghost"
          className="size-8 motion-press hover:scale-[1.03] active:scale-[0.96]"
          onClick={onToggleSandbox}
          title={sandboxCollapsed ? "Show sandbox panel" : "Hide sandbox panel"}
        >
          {sandboxCollapsed ? (
            <IconLayoutSidebarRightExpand className="size-4" />
          ) : (
            <IconLayoutSidebarRightCollapse className="size-4" />
          )}
        </Button>
      )}
    </>
  );

  const preConversationContent = useMemo(() => {
    if (!showSummaryStreaming && !hasSummary) return null;
    return (
      <AnimatePresence initial={false}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <Accordion
            type="single"
            collapsible
            defaultValue={showSummaryStreaming ? "summary" : undefined}
            className="w-full min-w-0 px-3 sm:px-6 bg-secondary rounded-b-3xl max-w-3xl mx-auto"
          >
            <AccordionItem value="summary" className="border-b-0">
              <AccordionTrigger className="py-2 text-sm">
                <div className="flex flex-row gap-2 items-center text-primary">
                  <IconSparkles size={14} />
                  <p>Session summary</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                {showSummaryStreaming ? (
                  <StreamingActivityDisplay
                    activity={summaryStreamingActivity}
                  />
                ) : hasSummary ? (
                  <ul className="list-disc list-inside text-sm text-primary space-y-1 pl-4">
                    {summary?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </AnimatePresence>
    );
  }, [showSummaryStreaming, hasSummary, summaryStreamingActivity, summary]);

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

  const preInputContent =
    mode === "plan" && planContent && sandboxCollapsed !== false ? (
      <AnimatePresence initial={false}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <SessionPrdPlanView
            sessionId={sessionId}
            planContent={planContent}
            onApprovePlan={() => setMode("edit")}
            variant="compact"
            isArchived={isArchived}
          />
        </motion.div>
      </AnimatePresence>
    ) : null;

  const toolsBefore = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50">
          <SelectedModeIcon className="size-3.5" />
          {selectedModeOption.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => {
            if (value === "edit" || value === "plan") {
              setMode(value);
            }
          }}
        >
          {SESSION_MODE_OPTIONS.map((option) => {
            const ModeIcon = option.icon;
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <ModeIcon size={14} />
                {option.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const emptyStateTitle = isSandboxActive
    ? "No messages yet. Start the conversation!"
    : isSandboxToggling
      ? "Starting sandbox..."
      : "Sandbox is inactive. Start the sandbox to begin chatting.";

  const placeholder = !isSandboxActive
    ? "Start the sandbox to begin chatting..."
    : mode === "plan"
      ? "Describe the product requirements to Eva..."
      : "Ask questions or request changes to Eva...";

  return (
    <ChatPageWrapper
      title={title}
      isArchived={isArchived}
      headerLeft={headerLeft}
      headerRight={headerRight}
    >
      <ChatBody
        repoId={repo._id}
        repoBasePath={basePath}
        conversationId={sessionId}
        messages={messages}
        pendingMessages={pendingMessages}
        queuedMessages={queuedMessages}
        streamingActivity={streamingActivity}
        streamingContent={streamingContent}
        streamingPendingQuestion={streamingPendingQuestion}
        isExecuting={isExecuting}
        isInputDisabled={!isSandboxActive}
        isArchived={isArchived}
        placeholder={placeholder}
        emptyStateTitle={emptyStateTitle}
        emptyStateOverride={emptyStateOverride}
        beforeQueuedContent={beforeQueuedContent}
        preInputContent={preInputContent}
        preConversationContent={preConversationContent}
        toolsBefore={toolsBefore}
        model={model}
        setModel={setModel}
        modelOptions={modelOptions}
        onSend={handleSend}
        onCancel={handleCancel}
        formatQueuedInfo={formatQueuedInfo}
        draft={draftBundle}
        isDraftLoading={!draftSeed.isReady}
      />
      <Dialog
        open={showSummaryModal}
        onOpenChange={(v) => {
          if (!v) setShowSummaryModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasSummary ? "Regenerate Summary" : "Generate Summary"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {hasSummary
                ? "This will regenerate and replace the current session summary."
                : "This will generate a session summary from the current chat history."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSummaryModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleGenerateSummary();
                setShowSummaryModal(false);
              }}
              disabled={isSummarizing}
            >
              {isSummarizing ? <Spinner size="sm" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showReviewModal}
        onOpenChange={(v) => {
          if (!v) handleReviewModalClose();
        }}
      >
        <DialogContent>
          <AnimatePresence initial={false} mode="wait">
            {reviewStep === "confirm" && (
              <motion.div
                key="confirm"
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle>Send for Code Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    By clicking this you confirm that all your changes have been
                    tested in your session, you are happy with those changes,
                    have generated a summary, and agree with the changes. Your
                    session will become uneditable while a developer reviews the
                    code changes before merging into staging/production.
                  </p>
                  <p>
                    The following audits will also run automatically in the
                    background:
                  </p>
                  <p>
                    An automated code audit will run to check accessibility,
                    testing, code quality, and other configured checks.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={handleReviewModalClose}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={handleCreatePr}
                    disabled={isCreatingPr}
                  >
                    {isCreatingPr ? <Spinner size="sm" /> : "Confirm"}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
            {reviewStep === "auditing" && (
              <motion.div
                key="auditing"
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle>Auditing in Progress</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {REVIEW_AUDITS.map((audit, i) => {
                    const isComplete = i < completedAudits;
                    const isActive =
                      i === completedAudits &&
                      completedAudits < REVIEW_AUDITS.length;
                    return (
                      <motion.div
                        key={audit}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.2 }}
                      >
                        <div className="flex h-5 w-5 items-center justify-center">
                          {isComplete ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                              }}
                            >
                              <IconCircleCheck
                                size={20}
                                className="text-success"
                              />
                            </motion.div>
                          ) : isActive ? (
                            <Spinner size="sm" />
                          ) : (
                            <div className="h-4 w-4 rounded-full ring-2 ring-muted" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${isComplete || isActive ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {audit}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {reviewStep === "complete" && (
              <motion.div
                key="complete"
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle>Review Sent</DialogTitle>
                </DialogHeader>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="rounded-surface bg-success/10 p-4 text-center"
                >
                  <IconCircleCheck
                    size={24}
                    className="mx-auto mb-2 text-success"
                  />
                  <p className="text-sm font-medium text-success">
                    This information has automatically been sent to the dev
                    team.
                  </p>
                </motion.div>
                <DialogFooter>
                  <Button onClick={handleReviewModalClose}>Done</Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </ChatPageWrapper>
  );
}
