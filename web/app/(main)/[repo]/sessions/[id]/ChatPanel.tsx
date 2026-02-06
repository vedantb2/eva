"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/lib/components/ui/accordion";
import { Button } from "@/lib/components/ui/button";
import { Spinner } from "@/lib/components/ui/spinner";
import { Badge } from "@/lib/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/lib/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/lib/components/ui/tabs";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconCode,
  IconMessageCircle2,
  IconClipboardList,
  IconFileText,
  IconGitPullRequest,
  IconWorld,
  IconSparkles,
  IconSend,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import {
  ModelSelector,
  type ClaudeModel,
} from "@/lib/components/ui/ModelSelector";
import {
  ResponseLengthSelector,
  type ResponseLength,
} from "@/lib/components/ui/ResponseLengthSelector";
import Link from "next/link";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import type { FunctionReturnType } from "convex/server";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/lib/components/ai-elements/conversation";
import {
  Message as AIMessage,
  MessageContent,
  MessageResponse,
} from "@/lib/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/lib/components/ai-elements/reasoning";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/lib/components/ai-elements/prompt-input";

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
}: ChatPanelProps) {
  const { repo } = useRepo();
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [mode, setMode] = useState<SessionMode>("execute");
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
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-neutral-900 dark:text-white truncate max-w-[200px]">
            {title}
          </h1>
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSandboxActive ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
            title={isSandboxActive ? "Active" : "Inactive"}
          />
        </div>
        <div className="flex items-center gap-2">
          {branchName && !prUrl && (
            <Button
              size="sm"
              variant="secondary"
              className="text-green-600"
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
          >
            {isSummarizing ? (
              <Spinner size="sm" />
            ) : (
              <IconSparkles className="size-5" />
            )}
          </Button>
          <Button
            size="icon"
            variant={isSandboxActive ? "destructive" : "secondary"}
            onClick={() => onSandboxToggle(isSandboxActive ? "stop" : "start")}
            disabled={isSandboxToggling}
            className={`h-8 w-8 ${!isSandboxActive ? "text-green-600" : ""}`}
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
      {summary && summary.length > 0 && (
        <Accordion type="single" collapsible className="px-4">
          <AccordionItem value="summary" className="border-b-0">
            <AccordionTrigger className="py-2 text-sm">
              <div className="flex flex-row gap-2 items-center text-primary">
                <IconSparkles size={14} />
                <p>Session summary</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="list-disc list-inside text-sm text-primary space-y-1 pl-4">
                {summary.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
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
                      <ReasoningContent>
                        {streamingActivity || "Starting..."}
                      </ReasoningContent>
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
                          <ReasoningContent>
                            {message.activityLog}
                          </ReasoningContent>
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
                        <IconClipboardList className="w-3 h-3" /> Plan
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
                      <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">U</span>
                      </div>
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
          {mode === "plan" && planContent && (
            <Button
              size="sm"
              variant="secondary"
              className="text-green-600 h-6"
              onClick={() => setShowPlanModal(true)}
            >
              <IconFileText className="w-3 h-3" />
              View Plan
            </Button>
          )}
        </div>
        <PromptInput onSubmit={handlePromptSubmit}>
          <PromptInputTextarea
            placeholder={
              !isSandboxActive
                ? "Start the sandbox to begin chatting..."
                : mode === "execute"
                  ? "Describe the changes to make to Eva..."
                  : mode === "ask"
                    ? "Ask Eva a question about the codebase..."
                    : "Describe what you want to build to Eva..."
            }
            disabled={isInputDisabled}
          />
          <PromptInputFooter>
            <PromptInputTools>
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as SessionMode)}
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
                    Plan
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <ModelSelector
                value={model}
                onChange={setModel}
                isDisabled={isInputDisabled}
              />
              <ResponseLengthSelector
                value={responseLength}
                onChange={setResponseLength}
                isDisabled={isInputDisabled}
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
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
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
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleCreatePr}
              disabled={isCreatingPr}
            >
              {isCreatingPr ? <Spinner size="sm" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showPlanModal}
        onOpenChange={(v) => {
          if (!v) setShowPlanModal(false);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Implementation Plan</DialogTitle>
          </DialogHeader>
          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
            {planContent ?? ""}
          </MessageResponse>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPlanModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
