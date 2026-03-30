"use client";

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
  Tabs,
  TabsList,
  TabsTrigger,
  Badge,
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputSpeech,
  ModelSelect,
  ResponseLengthSelect,
  type PromptInputMessage,
  Plan,
  PlanHeader,
  PlanTitle,
  PlanContent,
  PlanFooter,
  PlanTrigger,
} from "@conductor/ui";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCode,
  IconMessageCircle2,
  IconClipboardList,
  IconGitPullRequest,
  IconBrandVercel,
  IconSparkles,
  IconSend,
  IconCircleCheck,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQueryState } from "nuqs";
import { sessionModeParser } from "@/lib/search-params";
import type { ClaudeModel, ResponseLength } from "@conductor/ui";
import { useRouter } from "next/navigation";
import { useQuery } from "convex-helpers/react/cache";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { FunctionReturnType } from "convex/server";
import dayjs from "@conductor/shared/dates";
import { ChatPageWrapper } from "@/lib/components/ChatPageWrapper";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import { QueuedMessagesPanel } from "@/lib/components/QueuedMessagesPanel";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";
import {
  getSessionModel,
  getSessionResponseLength,
  useSessionModelSetter,
  useSessionResponseLengthSetter,
} from "@/lib/hooks/useSessionSettings";

type SessionMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];
type QueuedSessionMessage = NonNullable<
  FunctionReturnType<typeof api.queuedMessages.listByParent>
>[number];
type SessionMode = NonNullable<SessionMessage["mode"]>;

const REVIEW_AUDITS = [
  "Running code audits",
  "Analyzing results",
  "Generating report",
];

interface ChatPanelProps {
  sessionId: Id<"sessions">;
  title: string;
  branchName?: string;
  prUrl?: string;
  summary?: string[];
  messages: SessionMessage[];
  queuedMessages: QueuedSessionMessage[];
  planContent?: string;
  streamingActivity?: string;
  streamingContent?: string;
  summaryStreamingActivity?: string;
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  onSandboxToggle: (action: "start" | "stop") => void;
  isArchived?: boolean;
  previewUrl?: string;
  sandboxCollapsed?: boolean;
  onToggleSandbox?: () => void;
}

export function ChatPanel({
  sessionId,
  title,
  branchName,
  prUrl,
  summary,
  messages,
  queuedMessages,
  planContent,
  streamingActivity,
  streamingContent,
  summaryStreamingActivity,
  isSandboxActive,
  isSandboxToggling,
  onSandboxToggle,
  isArchived,
  previewUrl,
  sandboxCollapsed,
  onToggleSandbox,
}: ChatPanelProps) {
  const router = useRouter();
  const { repo } = useRepo();
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [reviewStep, setReviewStep] = useState<
    "confirm" | "auditing" | "complete"
  >("confirm");
  const [completedAudits, setCompletedAudits] = useState(0);
  const [mode, setMode] = useQueryState("mode", sessionModeParser);

  const defaultModel = repo.defaultModel ?? "sonnet";
  const initialModel = useMemo(
    () => getSessionModel(sessionId, defaultModel),
    [sessionId, defaultModel],
  );
  const initialResponseLength = useMemo(
    () => getSessionResponseLength(sessionId, "default"),
    [sessionId],
  );
  const [model, setModelState] = useState<ClaudeModel>(initialModel);
  const [responseLength, setResponseLengthState] = useState<ResponseLength>(
    initialResponseLength,
  );

  const saveModel = useSessionModelSetter(sessionId);
  const saveResponseLength = useSessionResponseLengthSetter(sessionId);

  const setModel = useCallback(
    (m: ClaudeModel) => {
      setModelState(m);
      saveModel(m);
    },
    [saveModel],
  );

  const setResponseLength = useCallback(
    (rl: ResponseLength) => {
      setResponseLengthState(rl);
      saveResponseLength(rl);
    },
    [saveResponseLength],
  );

  const evaIcon = <EvaIcon />;

  const updateLastMessage = useMutation(api.sessions.updateLastMessage);
  const startSummarize = useMutation(api.summarizeWorkflow.startSummarize);
  const addMessage = useMutation(api.sessions.addMessage);

  const startExecution = useMutation(api.sessionWorkflow.startExecute);
  const enqueueMessage = useMutation(api.sessionWorkflow.enqueueMessage);
  const updateQueuedMessage = useMutation(api.queuedMessages.update);
  const deleteQueuedMessage = useMutation(api.queuedMessages.remove);
  const createPr = useAction(api.github.createSessionPr);
  const startAuditMutation = useMutation(api.audits.startSessionAudit);
  const sessionAudit = useQuery(
    api.audits.getBySession,
    reviewStep === "auditing" ? { sessionId } : "skip",
  );

  const sendToApi = useCallback(
    async (
      message: string,
      sendMode: SessionMode,
      sendModel: ClaudeModel,
      sendResponseLength: ResponseLength,
    ) => {
      await startExecution({
        sessionId,
        message,
        mode: sendMode,
        model: sendModel,
        responseLength: sendResponseLength,
      });
    },
    [startExecution, sessionId],
  );

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const content = text.trim();
    if (isExecuting) {
      await enqueueMessage({
        sessionId,
        message: content,
        mode,
        model,
        responseLength,
      });
      return;
    }
    setIsSending(true);
    try {
      await addMessage({ id: sessionId, role: "user", content, mode });
      await sendToApi(content, mode, model, responseLength);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message";
      await addMessage({
        id: sessionId,
        role: "assistant",
        content: `Error: ${errorMessage}`,
        mode,
      });
      setIsSending(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      await startSummarize({
        sessionId,
      });
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
        await startAuditMutation({
          sessionId,
        });
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

  const lastMessage = messages[messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting = isSending || lastAssistantHasNoContent;

  useEffect(() => {
    if (isSending && lastMessage?.role === "assistant" && lastMessage.content) {
      setIsSending(false);
    }
  }, [isSending, lastMessage]);

  const cancelExecutionMutation = useMutation(
    api.sessionWorkflow.cancelExecution,
  );

  const handleCancel = async () => {
    await cancelExecutionMutation({ sessionId });
  };

  const isInputDisabled = !isSandboxActive;
  const submitStatus =
    isSending && !lastAssistantHasNoContent ? "submitted" : undefined;

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    if (isInputDisabled) return;
    await handleSend(text);
  };

  const hasSummary = Boolean(summary && summary.length > 0);
  const showSummaryStreaming = Boolean(summaryStreamingActivity);
  const queuedMessageItems = useMemo(
    () =>
      queuedMessages.map((message) => {
        const modeLabel =
          message.mode === "execute"
            ? "Execute"
            : message.mode === "plan"
              ? "PRD"
              : "Ask";
        const detailParts = [
          modeLabel,
          message.model ? message.model : null,
          message.responseLength && message.responseLength !== "default"
            ? message.responseLength
            : null,
        ].filter((part): part is string => Boolean(part));
        return {
          id: message._id,
          content: message.content,
          info: detailParts.length > 0 ? detailParts.join(" / ") : undefined,
        };
      }),
    [queuedMessages],
  );

  const headerLeft = (
    <Button
      size="icon"
      variant={isSandboxActive ? "destructive" : "secondary"}
      onClick={() => onSandboxToggle(isSandboxActive ? "stop" : "start")}
      disabled={isSandboxToggling}
      className={`motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97] ${isSandboxActive ? "" : "text-success"}`}
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
      <Button
        size="sm"
        variant="secondary"
        className="motion-press text-primary hover:scale-[1.01] active:scale-[0.99]"
        asChild={!!previewUrl}
        disabled={!previewUrl}
      >
        {previewUrl ? (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <IconBrandVercel size={14} />
            <span className="hidden sm:inline">View Preview</span>
          </a>
        ) : (
          <>
            <IconBrandVercel size={14} />
            <span className="hidden sm:inline">View Preview</span>
          </>
        )}
      </Button>
      {prUrl ? (
        <div
          onClick={() => window.open(prUrl, "_blank")}
          className="cursor-pointer"
        >
          <Badge
            variant="outline"
            className="motion-base gap-1 cursor-pointer hover:scale-[1.01]"
          >
            <IconGitPullRequest size={12} />
            View PR
          </Badge>
        </div>
      ) : branchName ? (
        <Button
          size="sm"
          variant="secondary"
          className="motion-press text-success hover:scale-[1.01] active:scale-[0.99]"
          onClick={() => setShowReviewModal(true)}
        >
          <IconSend size={12} />
          <span className="hidden sm:inline">Send for Review</span>
        </Button>
      ) : null}
      <Button
        size="icon"
        variant="secondary"
        onClick={() => setShowSummaryModal(true)}
        disabled={isSummarizing || !isSandboxActive || messages.length === 0}
        className="motion-press h-8 w-8 text-primary hover:scale-[1.03] active:scale-[0.97]"
        title={hasSummary ? "Regenerate summary" : "Generate summary"}
      >
        {isSummarizing ? (
          <Spinner size="sm" />
        ) : (
          <IconSparkles className="w-4 h-4" />
        )}
      </Button>
      {onToggleSandbox && (
        <Button
          size="icon"
          variant="ghost"
          className="size-8 motion-press hover:scale-[1.03] active:scale-[0.97]"
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

  return (
    <ChatPageWrapper
      title={title}
      isArchived={isArchived}
      headerLeft={headerLeft}
      headerRight={headerRight}
    >
      <AnimatePresence>
        {(showSummaryStreaming || hasSummary) && (
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
              className="w-full min-w-0 px-3 sm:px-6 bg-secondary rounded-b-3xl"
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
        )}
      </AnimatePresence>
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-3 p-3">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title={
                isSandboxActive
                  ? "No messages yet. Start the conversation!"
                  : "Sandbox is inactive. Start the sandbox to begin chatting."
              }
            />
          ) : (
            messages.map((message) =>
              message.isSystemAlert ? (
                <SystemAlertMessage
                  key={message._id}
                  content={message.content ?? ""}
                  errorDetail={message.errorDetail}
                />
              ) : (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AIMessage from={message.role}>
                    <MessageContent
                      className={
                        message.role === "user"
                          ? "rounded-xl bg-secondary text-foreground px-4 py-3"
                          : "px-1 py-2"
                      }
                    >
                      {message.role === "assistant" && !message.content ? (
                        <>
                          {streamingContent ? (
                            <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                              {streamingContent}
                            </MessageResponse>
                          ) : null}
                          <StreamingActivityDisplay
                            activity={streamingActivity}
                            name="Eva"
                            icon={evaIcon}
                            startedAt={message.timestamp}
                          />
                        </>
                      ) : (
                        <>
                          {message.role === "assistant" ? (
                            <>
                              {message.activityLog && (
                                <ActivityLogDisplay
                                  activityLog={message.activityLog}
                                  name="Eva"
                                  icon={evaIcon}
                                  startedAt={message.timestamp}
                                  finishedAt={message.finishedAt}
                                />
                              )}
                              <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                                {message.content}
                              </MessageResponse>
                              {message.imageUrl && (
                                <ScreenshotPreview url={message.imageUrl} />
                              )}
                              {message.videoUrl && (
                                <VideoPreview url={message.videoUrl} />
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div className="flex items-center justify-between gap-3">
                                {message.mode && (
                                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                                    {message.mode === "execute" && (
                                      <>
                                        <IconCode className="w-2.5 h-2.5" />{" "}
                                        Execute
                                      </>
                                    )}
                                    {message.mode === "ask" && (
                                      <>
                                        <IconMessageCircle2 className="w-2.5 h-2.5" />{" "}
                                        Ask
                                      </>
                                    )}
                                    {message.mode === "plan" && (
                                      <>
                                        <IconClipboardList className="w-2.5 h-2.5" />{" "}
                                        PRD
                                      </>
                                    )}
                                  </div>
                                )}
                                {message.timestamp && (
                                  <span className="text-[11px] text-muted-foreground/60">
                                    {dayjs(message.timestamp).format("h:mm A")}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </MessageContent>
                    {message.role === "user" && (
                      <div className="mt-0.5 ml-auto">
                        <UserMessageAvatar userId={message.userId} />
                      </div>
                    )}
                  </AIMessage>
                </motion.div>
              ),
            )
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {!isArchived && (
        <div className="p-2 md:p-3">
          <QueuedMessagesPanel
            items={queuedMessageItems}
            onEdit={async (id, content) => {
              await updateQueuedMessage({ id, content });
            }}
            onDelete={async (id) => {
              await deleteQueuedMessage({ id });
            }}
          />
          <AnimatePresence>
            {mode === "plan" && planContent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <Plan defaultOpen className="mb-2">
                  <PlanHeader className="p-4">
                    <PlanTitle>Product Requirements</PlanTitle>
                    <PlanTrigger />
                  </PlanHeader>
                  <PlanContent className="px-3 pb-3 pt-0 max-h-40 overflow-y-auto sm:px-4 sm:pb-4 sm:max-h-64">
                    <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                      {planContent}
                    </MessageResponse>
                  </PlanContent>
                  <PlanFooter className="px-4 pb-4 pt-0 gap-2">
                    <Button
                      size="sm"
                      className="motion-press bg-success text-success-foreground hover:bg-success/90 hover:scale-[1.01] active:scale-[0.99]"
                      onClick={() => setMode("execute")}
                    >
                      <IconCode className="w-3.5 h-3.5" />
                      Approve Plan
                    </Button>
                  </PlanFooter>
                </Plan>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative pt-4">
            <Tabs
              value={mode}
              onValueChange={(v) => {
                if (v === "execute" || v === "ask" || v === "plan") {
                  setMode(v);
                }
              }}
              className="absolute left-1.5 top-4 z-20 -translate-y-1/2 sm:left-3"
            >
              <TabsList className="h-8 rounded-full  p-0.5">
                <TabsTrigger
                  value="execute"
                  className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary"
                >
                  <IconCode className="w-3 h-3" />
                  Execute
                </TabsTrigger>
                <TabsTrigger
                  value="ask"
                  className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary"
                >
                  <IconMessageCircle2 className="w-3 h-3" />
                  Ask
                </TabsTrigger>
                <TabsTrigger
                  value="plan"
                  className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary"
                >
                  <IconClipboardList className="w-3 h-3" />
                  PRD
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <PromptInput onSubmit={handlePromptSubmit}>
              <PromptInputTextarea
                className="pt-8"
                placeholder={
                  !isSandboxActive
                    ? "Start the sandbox to begin chatting..."
                    : mode === "execute"
                      ? "Describe the changes to make to Eva..."
                      : mode === "ask"
                        ? "Ask Eva a question about the codebase..."
                        : "Describe the feature or product requirements to Eva..."
                }
                disabled={isInputDisabled}
              />
              <PromptInputFooter>
                <PromptInputTools>
                  <ModelSelect
                    value={model}
                    onValueChange={setModel}
                    disabled={isInputDisabled}
                  />
                  <ResponseLengthSelect
                    value={responseLength}
                    onValueChange={setResponseLength}
                    disabled={isInputDisabled}
                  />
                </PromptInputTools>
                <div className="flex items-center gap-1">
                  <PromptInputSpeech disabled={isInputDisabled} />
                  {isExecuting ? (
                    <Button
                      size="icon-sm"
                      type="button"
                      variant="destructive"
                      onClick={handleCancel}
                      title="Stop Eva"
                    >
                      <IconPlayerStop className="size-4" />
                    </Button>
                  ) : null}
                  <PromptInputSubmit
                    status={submitStatus}
                    disabled={isInputDisabled}
                    title={isExecuting ? "Queue message" : "Send message"}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
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
          <AnimatePresence mode="wait">
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
                  className="rounded-lg bg-success/10 p-4 text-center"
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
