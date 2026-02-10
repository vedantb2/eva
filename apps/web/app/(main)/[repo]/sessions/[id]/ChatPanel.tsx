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
  IconLayoutSidebarRightCollapse,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { sessionModeParser } from "@/lib/search-params";
import type { ClaudeModel, ResponseLength } from "@conductor/ui";
import Link from "next/link";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import type { FunctionReturnType } from "convex/server";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;
type SessionMessage = Session["messages"][number];
type SessionMode = NonNullable<SessionMessage["mode"]>;

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
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [mode, setMode] = useQueryState("mode", sessionModeParser);
  const [model, setModel] = useState<ClaudeModel>("sonnet");
  const [responseLength, setResponseLength] =
    useState<ResponseLength>("default");
  const typedSessionId = sessionId as Id<"sessions">;

  const updateLastMessage = useMutation(api.sessions.updateLastMessage);
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

  const sendToApi = useCallback(
    async (
      message: string,
      sendMode: SessionMode,
      sendModel: ClaudeModel,
      sendResponseLength: ResponseLength,
    ) => {
      const response = await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "session/execute",
          data: {
            sessionId,
            message,
            mode: sendMode,
            model: sendModel,
            responseLength: sendResponseLength,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
    },
    [sessionId],
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
      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "session/summary.generate",
          data: {
            sessionId,
            repoId: repo._id,
            installationId: repo.installationId,
          },
        }),
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCreatePr = async () => {
    setIsCreatingPr(true);
    try {
      const response = await fetch("/api/sessions/create-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create PR");
      }
      setShowReviewModal(false);
    } finally {
      setIsCreatingPr(false);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting = isSending || lastAssistantHasNoContent;

  useEffect(() => {
    if (isSending && lastMessage?.role === "assistant" && lastMessage.content) {
      setIsSending(false);
    }
  }, [isSending, lastMessage]);

  const handleCancel = async () => {
    await fetch("/api/inngest/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "session/execute.cancel",
        data: { sessionId },
      }),
    });
    await updateLastMessage({
      id: typedSessionId,
      content: "Execution cancelled by user.",
    });
  };

  const isInputDisabled = !isSandboxActive || isSending || isExecuting;
  const submitStatus = isExecuting
    ? lastAssistantHasNoContent
      ? "streaming"
      : "submitted"
    : undefined;

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  const filteredMessages = messages.filter((m) => m.mode !== "flag");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onCollapse}
        >
          <IconLayoutSidebarRightCollapse size={16} />
        </Button>
        <div className="flex items-center gap-2">
          {branchName && !prUrl && (
            <Button
              size="sm"
              variant="secondary"
              className="text-success"
              onClick={() => setShowReviewModal(true)}
            >
              <IconSend size={12} />
              Send for Review
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            onClick={handleGenerateSummary}
            disabled={
              isSummarizing || !isSandboxActive || messages.length === 0
            }
            className="h-8 w-8 text-primary"
            title={
              summary && summary.length > 0
                ? "Regenerate summary"
                : "Generate summary"
            }
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
            className={`h-8 w-8 ${!isSandboxActive ? "text-success" : ""}`}
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
      {(streamingActivity || (summary && summary.length > 0)) && (
        <Accordion
          type="single"
          collapsible
          defaultValue={streamingActivity ? "summary" : undefined}
          className="px-4"
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
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Spinner size="sm" />
                  <span className="truncate">{streamingActivity}</span>
                </div>
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
      )}
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-4">
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
              <AIMessage key={index} from={message.role}>
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
                      ? "rounded-2xl bg-secondary text-foreground px-4 py-3"
                      : "px-1 py-2"
                  }
                >
                  {message.role === "assistant" && !message.content ? (
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
                      {message.role === "assistant" && message.activityLog && (
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
                      )}
                    </>
                  )}
                </MessageContent>
                {message.mode && message.role === "user" && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
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
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="px-3 pb-4 pt-3">
        <div className="flex items-center gap-1 mb-2">
          {prUrl && (
            <Link href={prUrl} target="_blank">
              <Badge variant="outline" className="gap-1 cursor-pointer">
                <IconGitPullRequest size={12} />
                View PR
              </Badge>
            </Link>
          )}
          <Link
            href={
              prUrl ??
              `https://github.com/${repo.owner}/${repo.name}/tree/${branchName}`
            }
          >
            <Badge variant="outline" className="gap-1 cursor-pointer">
              <IconWorld size={12} />
              View Preview
            </Badge>
          </Link>
        </div>
        {mode === "plan" && planContent && (
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
                className="bg-success text-success-foreground hover:bg-success/90"
                onClick={() => setMode("execute")}
              >
                <IconCode className="w-3.5 h-3.5" />
                Approve Plan
              </Button>
            </PlanFooter>
          </Plan>
        )}
        <PromptInput onSubmit={handlePromptSubmit}>
          <PromptInputTextarea
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
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setMode(v as "execute" | "ask" | "plan");
                }}
              >
                <TabsList className="h-8">
                  <TabsTrigger
                    value="execute"
                    className="text-xs px-2 py-1 gap-1"
                  >
                    <IconCode className="w-3 h-3" />
                    Execute
                  </TabsTrigger>
                  <TabsTrigger value="ask" className="text-xs px-2 py-1 gap-1">
                    <IconMessageCircle2 className="w-3 h-3" />
                    Ask
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="text-xs px-2 py-1 gap-1">
                    <IconClipboardList className="w-3 h-3" />
                    PRD
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <PromptInputSettings
                model={model}
                onModelChange={setModel}
                responseLength={responseLength}
                onResponseLengthChange={setResponseLength}
                disabled={isInputDisabled}
              />
            </PromptInputTools>
            <PromptInputSubmit
              status={submitStatus}
              onStop={handleCancel}
              disabled={isInputDisabled}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
      <Dialog
        open={showReviewModal}
        onOpenChange={(v) => {
          if (!v) setShowReviewModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send for Code Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            By clicking this you confirm that all your changes have been tested
            in your session, you are happy with those changes, have generated a
            summary and agree with the changes. A developer will then review the
            code changes Eva has made and get in contact to confirm if they are
            happy before merging into staging/production.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReviewModal(false)}>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
