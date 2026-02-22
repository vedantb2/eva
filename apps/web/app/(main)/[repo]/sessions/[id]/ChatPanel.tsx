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
  Reasoning,
  CollapsibleContent,
  ReasoningTrigger,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputSpeech,
  PromptInputSettings,
  type PromptInputMessage,
  Avatar,
  AvatarFallback,
  Plan,
  PlanHeader,
  PlanTitle,
  PlanContent,
  PlanFooter,
  PlanTrigger,
  ActivitySteps,
} from "@conductor/ui";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCode,
  IconMessageCircle2,
  IconClipboardList,
  IconGitPullRequest,
  IconWorld,
  IconSparkles,
  IconSend,
  IconCircleCheck,
  IconLayoutSidebarRightCollapse,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQueryState } from "nuqs";
import { sandboxTabParser, sessionModeParser } from "@/lib/search-params";
import type { ClaudeModel, ResponseLength } from "@conductor/ui";
import Link from "next/link";
import Image from "next/image";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { getWorkflowTokens } from "@/app/(main)/[repo]/actions";
import { useSetupStatus } from "@/lib/hooks/useSetupStatus";
import { UserInitials } from "@conductor/shared";
import type { FunctionReturnType } from "convex/server";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;
type SessionMessage = Session["messages"][number];
type SessionMode = NonNullable<SessionMessage["mode"]>;

const REVIEW_AUDITS = [
  "Accessibility audit",
  "Code testing audit",
  "Code review audit",
];

interface ChatPanelProps {
  sessionId: string;
  title: string;
  branchName?: string;
  prUrl?: string;
  summary?: string[];
  messages: SessionMessage[];
  planContent?: string;
  streamingActivity?: string;
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  onSandboxToggle: (action: "start" | "stop") => void;
  onCollapse: () => void;
}

export function ChatPanel({
  sessionId,
  title,
  branchName,
  prUrl,
  summary,
  messages,
  planContent,
  streamingActivity,
  isSandboxActive,
  isSandboxToggling,
  onSandboxToggle,
  onCollapse,
}: ChatPanelProps) {
  const { repo } = useRepo();
  const setupStatus = useSetupStatus();
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
  const [, setActiveTab] = useQueryState("tab", sandboxTabParser);
  const [model, setModel] = useState<ClaudeModel>("sonnet");
  const [responseLength, setResponseLength] =
    useState<ResponseLength>("default");
  const typedSessionId = sessionId as Id<"sessions">;

  const updateLastMessage = useMutation(api.sessions.updateLastMessage);
  const startSummarize = useMutation(api.summarizeWorkflow.startSummarize);
  const addMessage = useMutation(api.sessions.addMessage).withOptimisticUpdate(
    (localStore, args) => {
      const session = localStore.getQuery(api.sessions.get, { id: args.id });
      if (!session) return;
      localStore.setQuery(
        api.sessions.get,
        { id: args.id },
        {
          ...session,
          messages: [
            ...session.messages,
            {
              role: args.role,
              content: args.content,
              timestamp: Date.now(),
              mode: args.mode,
            },
          ],
        },
      );
    },
  );

  const startExecution = useMutation(api.sessionWorkflow.startExecute);
  const createPr = useAction(api.github.createSessionPr);
  const startAuditMutation = useMutation(api.sessionAudits.startAudit);
  const sessionAudit = useQuery(
    api.sessionAudits.getBySession,
    reviewStep === "auditing" ? { sessionId: typedSessionId } : "skip",
  );

  const sendToApi = useCallback(
    async (
      message: string,
      sendMode: SessionMode,
      sendModel: ClaudeModel,
      sendResponseLength: ResponseLength,
    ) => {
      const { githubToken, convexToken } = await getWorkflowTokens(
        repo.installationId,
      );
      await startExecution({
        sessionId: typedSessionId,
        message,
        mode: sendMode,
        model: sendModel,
        responseLength: sendResponseLength,
        convexToken,
        githubToken,
      });
    },
    [repo.installationId, startExecution, typedSessionId],
  );

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const content = text.trim();
    setIsSending(true);
    try {
      await addMessage({ id: typedSessionId, role: "user", content, mode });
      await sendToApi(content, mode, model, responseLength);
    } catch {
      setIsSending(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const { githubToken, convexToken } = await getWorkflowTokens(
        repo.installationId,
      );
      await startSummarize({
        sessionId: typedSessionId,
        convexToken,
        githubToken,
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
      await createPr({ sessionId: typedSessionId });
      try {
        const { convexToken } = await getWorkflowTokens(repo.installationId);
        await startAuditMutation({
          sessionId: typedSessionId,
          convexToken,
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
    await cancelExecutionMutation({ sessionId: typedSessionId });
  };

  const isInputDisabled =
    !isSandboxActive || isSending || isExecuting || !setupStatus?.isReady;
  const submitStatus = isExecuting
    ? lastAssistantHasNoContent
      ? "streaming"
      : "submitted"
    : undefined;

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  const filteredMessages = messages.filter((m) => m.mode !== "flag");
  const hasSummary = Boolean(summary && summary.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between p-3 animate-in fade-in duration-300">
        <Button
          size="icon"
          variant="ghost"
          className="motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97]"
          onClick={onCollapse}
        >
          <IconLayoutSidebarRightCollapse size={16} />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="motion-press text-primary hover:scale-[1.01] active:scale-[0.99]"
            onClick={() => setActiveTab("preview")}
          >
            <IconWorld size={14} />
            View Preview
          </Button>
          {prUrl ? (
            <Link href={prUrl} target="_blank">
              <Badge
                variant="outline"
                className="motion-base gap-1 cursor-pointer hover:scale-[1.01]"
              >
                <IconGitPullRequest size={12} />
                View PR
              </Badge>
            </Link>
          ) : branchName ? (
            <Button
              size="sm"
              variant="secondary"
              className="motion-press text-success hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => setShowReviewModal(true)}
            >
              <IconSend size={12} />
              Send for Review
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setShowSummaryModal(true)}
            disabled={
              isSummarizing || !isSandboxActive || messages.length === 0
            }
            className="motion-press h-8 w-8 text-primary hover:scale-[1.03] active:scale-[0.97]"
            title={hasSummary ? "Regenerate summary" : "Generate summary"}
          >
            {isSummarizing ? (
              <Spinner size="sm" />
            ) : (
              <IconSparkles className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant={isSandboxActive ? "destructive" : "secondary"}
            onClick={() => onSandboxToggle(isSandboxActive ? "stop" : "start")}
            disabled={isSandboxToggling}
            className={`motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97] ${!isSandboxActive ? "text-success" : ""}`}
          >
            {isSandboxToggling ? (
              <Spinner size="sm" />
            ) : isSandboxActive ? (
              <IconPlayerStop className="w-4 h-4" />
            ) : (
              <IconPlayerPlay className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {(streamingActivity || (summary && summary.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Accordion
              type="single"
              collapsible
              defaultValue={streamingActivity ? "summary" : undefined}
              className="px-6 bg-secondary rounded-b-3xl"
            >
              <AccordionItem value="summary" className="border-b-0">
                <AccordionTrigger className="py-2 text-sm">
                  <div className="flex flex-row gap-2 items-center text-primary">
                    <IconSparkles size={14} />
                    <p>Session summary</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  {streamingActivity ? (
                    (() => {
                      const summarySteps =
                        parseActivitySteps(streamingActivity);
                      return summarySteps ? (
                        <ActivitySteps steps={summarySteps} isStreaming />
                      ) : (
                        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                          <Spinner size="sm" />
                          <span className="truncate">{streamingActivity}</span>
                        </div>
                      );
                    })()
                  ) : summary && summary.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-primary space-y-1 pl-4">
                      {summary.map((item, i) => (
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
          {filteredMessages.length === 0 ? (
            <ConversationEmptyState
              title={
                isSandboxActive
                  ? "No messages yet. Start the conversation!"
                  : "Sandbox is inactive. Start the sandbox to begin chatting."
              }
            />
          ) : (
            filteredMessages.map((message, index) => (
              <motion.div
                key={`${message.timestamp ?? index}-${message.role}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <AIMessage from={message.role}>
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden">
                        <Image
                          src="/icon.png"
                          alt="Assistant"
                          width={28}
                          height={28}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Eva
                      </span>
                    </div>
                  )}
                  <MessageContent
                    className={
                      message.role === "user"
                        ? "rounded-xl bg-secondary text-foreground px-4 py-3"
                        : "px-1 py-2"
                    }
                  >
                    {message.role === "assistant" && !message.content ? (
                      (() => {
                        const steps = parseActivitySteps(streamingActivity);
                        return steps ? (
                          <ActivitySteps steps={steps} isStreaming />
                        ) : (
                          <Reasoning isStreaming defaultOpen>
                            <ReasoningTrigger
                              getThinkingMessage={(streaming) =>
                                streaming ? "Working..." : "Processing complete"
                              }
                            />
                            <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
                              <pre className="whitespace-pre-wrap font-mono text-xs">
                                {streamingActivity || "Starting..."}
                              </pre>
                            </CollapsibleContent>
                          </Reasoning>
                        );
                      })()
                    ) : (
                      <>
                        {message.role === "assistant" ? (
                          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                            {message.content}
                          </MessageResponse>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                        {message.role === "assistant" &&
                          message.activityLog &&
                          (() => {
                            const steps = parseActivitySteps(
                              message.activityLog,
                            );
                            return steps ? (
                              <ActivitySteps steps={steps} />
                            ) : (
                              <Reasoning defaultOpen={false}>
                                <ReasoningTrigger
                                  getThinkingMessage={() => "View logs"}
                                />
                                <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
                                  <pre className="whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">
                                    {message.activityLog}
                                  </pre>
                                </CollapsibleContent>
                              </Reasoning>
                            );
                          })()}
                      </>
                    )}
                  </MessageContent>
                  {message.mode && message.role === "user" && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto animate-in fade-in duration-200">
                      {message.mode === "execute" && (
                        <>
                          <IconCode className="w-3 h-3" /> Execute
                        </>
                      )}
                      {message.mode === "ask" && (
                        <>
                          <IconMessageCircle2 className="w-3 h-3" /> Ask
                        </>
                      )}
                      {message.mode === "plan" && (
                        <>
                          <IconClipboardList className="w-3 h-3" /> PRD
                        </>
                      )}
                    </div>
                  )}
                  {message.role === "user" && (
                    <div className="mt-0.5 ml-auto">
                      {message.userId ? (
                        <UserInitials
                          userId={message.userId}
                          hideLastSeen
                          size="md"
                        />
                      ) : (
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-secondary text-xs text-muted-foreground">
                            U
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                </AIMessage>
              </motion.div>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="px-3 pb-4 pt-3">
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
                <PlanContent className="px-4 pb-4 pt-0 max-h-64 overflow-y-auto">
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
              setMode(v as "execute" | "ask" | "plan");
            }}
            className="absolute left-3 top-4 z-20 -translate-y-1/2"
          >
            <TabsList className="h-8 rounded-full border border-border/70 bg-muted/90 p-0.5 shadow-sm">
              <TabsTrigger
                value="execute"
                className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <IconCode className="w-3 h-3" />
                Execute
              </TabsTrigger>
              <TabsTrigger
                value="ask"
                className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <IconMessageCircle2 className="w-3 h-3" />
                Ask
              </TabsTrigger>
              <TabsTrigger
                value="plan"
                className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm"
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
                <PromptInputSettings
                  model={model}
                  onModelChange={setModel}
                  responseLength={responseLength}
                  onResponseLengthChange={setResponseLength}
                  disabled={isInputDisabled}
                />
              </PromptInputTools>
              <div className="flex items-center gap-1">
                <PromptInputSpeech disabled={isInputDisabled} />
                <PromptInputSubmit
                  status={submitStatus}
                  onStop={handleCancel}
                  disabled={isInputDisabled}
                />
              </div>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
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
                  <ul className="ml-5 list-disc space-y-1">
                    <li>Accessibility audit</li>
                    <li>Code testing audit</li>
                    <li>Code review audit</li>
                  </ul>
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
                            <div className="h-4 w-4 rounded-full border-2 border-muted" />
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
                  className="rounded-lg border border-success/30 bg-success/10 p-4 text-center"
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
    </div>
  );
}
