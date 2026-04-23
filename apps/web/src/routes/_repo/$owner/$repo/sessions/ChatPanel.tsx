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
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  PromptInput,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputSpeech,
  usePromptInputController,
  ModelSelect,
  ResponseLengthSelect,
  type PromptInputMessage,
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
import type { ResponseLength } from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import {
  api,
  findAIModelOption,
  normalizeAIModel,
  type AIModel,
} from "@conductor/backend";
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
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import { SessionPrdPlanView } from "./_components/SessionPrdPlanView";
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { EntityContextUsage } from "@/lib/components/context-usage";

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

interface ParsedQuestion {
  question: string;
  header: string;
  options: Array<{ label: string; description: string }>;
  multiSelect: boolean;
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function isOptionItem(
  val: unknown,
): val is { label: string; description: string } {
  return (
    isRecord(val) &&
    typeof val.label === "string" &&
    typeof val.description === "string"
  );
}

function isParsedQuestion(val: unknown): val is ParsedQuestion {
  return (
    isRecord(val) &&
    typeof val.question === "string" &&
    typeof val.header === "string" &&
    typeof val.multiSelect === "boolean" &&
    Array.isArray(val.options) &&
    val.options.every(isOptionItem)
  );
}

function parsePendingQuestion(
  raw: string | undefined | null,
): ParsedQuestion[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.questions)) return null;
    const questions = parsed.questions.filter(isParsedQuestion);
    return questions.length > 0 ? questions : null;
  } catch {
    return null;
  }
}

interface SessionPromptSubmitProps {
  disabled: boolean;
  isExecuting: boolean;
  status: "submitted" | undefined;
}

function SessionPromptSubmit({
  disabled,
  isExecuting,
  status,
}: SessionPromptSubmitProps) {
  const { textInput } = usePromptInputController();
  const isEmpty = textInput.value.trim().length === 0;

  return (
    <PromptInputSubmit
      status={status}
      disabled={disabled || isEmpty}
      title={isExecuting ? "Queue message" : "Send message"}
    />
  );
}

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
  streamingPendingQuestion?: string;
  summaryStreamingActivity?: string;
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  onSandboxToggle: (action: "start" | "stop") => void;
  isArchived?: boolean;
  deploymentStatus?: "queued" | "building" | "deployed" | "error";
  deploymentUrl?: string;
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
  streamingPendingQuestion,
  summaryStreamingActivity,
  isSandboxActive,
  isSandboxToggling,
  onSandboxToggle,
  isArchived,
  deploymentStatus,
  deploymentUrl,
  sandboxCollapsed,
  onToggleSandbox,
}: ChatPanelProps) {
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

  const defaultModel = normalizeAIModel(repo.defaultModel);
  const { mode, setMode, model, setModel, responseLength, setResponseLength } =
    useSessionSettings(sessionId, { defaultModel });
  const { options: modelOptions } = useAvailableAiModels(repo._id, model);

  const AVAILABLE_MODES: SessionMode[] = ["edit", "plan"];
  useHotkey("Shift+Tab", (e) => {
    e.preventDefault();
    const currentIndex = AVAILABLE_MODES.indexOf(mode);
    const nextIndex = (currentIndex + 1) % AVAILABLE_MODES.length;
    setMode(AVAILABLE_MODES[nextIndex]);
  });

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
      sendModel: AIModel,
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
        const modeLabel = message.mode === "plan" ? "PRD" : "Edit";
        const detailParts = [
          modeLabel,
          message.model ? findAIModelOption(message.model).label : null,
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

  const [questionDismissed, setQuestionDismissed] = useState(false);

  const pendingQuestionRaw =
    streamingPendingQuestion ?? lastMessage?.pendingQuestion;
  const activePendingQuestion = useMemo(
    () => (questionDismissed ? null : parsePendingQuestion(pendingQuestionRaw)),
    [questionDismissed, pendingQuestionRaw],
  );

  useEffect(() => {
    if (pendingQuestionRaw) {
      setQuestionDismissed(false);
    }
  }, [pendingQuestionRaw]);

  const handleQuestionAnswer = useCallback(
    async (answer: string) => {
      setQuestionDismissed(true);
      await handleSend(answer);
    },
    [handleSend],
  );

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
      {!prUrl && branchName && (
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
            <DropdownMenuItem
              disabled={deploymentStatus !== "deployed"}
              onClick={() => {
                if (deploymentStatus === "deployed" && deploymentUrl) {
                  window.open(deploymentUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <IconBrandVercel size={14} />
              View Preview
              {deploymentStatus === "building" && " (Building...)"}
              {deploymentStatus === "queued" && " (Queued...)"}
              {deploymentStatus === "error" && " (Failed)"}
            </DropdownMenuItem>
          )}
          {prUrl && (
            <DropdownMenuItem
              onClick={() => {
                window.open(prUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <IconGitPullRequest size={14} />
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

  return (
    <ChatPageWrapper
      title={title}
      isArchived={isArchived}
      headerLeft={headerLeft}
      headerRight={headerRight}
    >
      <AnimatePresence initial={false}>
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
        )}
      </AnimatePresence>
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-3 p-3 max-w-3xl mx-auto w-full">
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
                          ? "group rounded-xl bg-secondary text-foreground px-4 py-3"
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
                          {activePendingQuestion && (
                            <div className="mt-3">
                              <MultipleChoiceQuestion
                                questions={activePendingQuestion}
                                onAnswer={handleQuestionAnswer}
                                isLoading={isSending}
                              />
                            </div>
                          )}
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
                              {message._id === lastMessage?._id &&
                                activePendingQuestion && (
                                  <div className="mt-3">
                                    <MultipleChoiceQuestion
                                      questions={activePendingQuestion}
                                      onAnswer={handleQuestionAnswer}
                                      isLoading={isSending}
                                    />
                                  </div>
                                )}
                            </>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          )}
                        </>
                      )}
                    </MessageContent>
                    {message.role === "user" && (
                      <div className="flex items-center justify-end gap-2 mt-0.5 ml-auto">
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {message.mode && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                              {message.mode === "plan" ? (
                                <>
                                  <IconClipboardList className="w-2.5 h-2.5" />{" "}
                                  PRD
                                </>
                              ) : (
                                <>
                                  <IconCode className="w-2.5 h-2.5" /> Edit
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
      {!isArchived && !activePendingQuestion && (
        <div className="p-2 md:p-3 max-w-3xl mx-auto w-full">
          <QueuedMessagesPanel
            items={queuedMessageItems}
            onEdit={async (id, content) => {
              await updateQueuedMessage({ id, content });
            }}
            onDelete={async (id) => {
              await deleteQueuedMessage({ id });
            }}
          />
          <AnimatePresence initial={false}>
            {mode === "plan" && planContent && sandboxCollapsed !== false && (
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
            )}
          </AnimatePresence>
          <div>
            <PromptInputProvider>
              <PromptInput onSubmit={handlePromptSubmit}>
                <PromptInputTextarea
                  placeholder={
                    !isSandboxActive
                      ? "Start the sandbox to begin chatting..."
                      : mode === "plan"
                        ? "Describe the product requirements to Eva..."
                        : "Ask questions or request changes to Eva..."
                  }
                  disabled={isInputDisabled}
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                          disabled={isInputDisabled}
                        >
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
                              <DropdownMenuRadioItem
                                key={option.value}
                                value={option.value}
                              >
                                <ModeIcon size={14} />
                                {option.label}
                              </DropdownMenuRadioItem>
                            );
                          })}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ResponseLengthSelect
                      value={responseLength}
                      onValueChange={setResponseLength}
                      disabled={isInputDisabled}
                    />
                  </PromptInputTools>
                  <div className="flex min-w-0 items-center gap-1">
                    <ModelSelect
                      value={model}
                      options={modelOptions}
                      onValueChange={setModel}
                      disabled={isInputDisabled}
                      className="max-w-48 truncate sm:max-w-none"
                    />
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
                    <SessionPromptSubmit
                      status={submitStatus}
                      disabled={isInputDisabled}
                      isExecuting={isExecuting}
                    />
                  </div>
                </PromptInputFooter>
              </PromptInput>
            </PromptInputProvider>
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
