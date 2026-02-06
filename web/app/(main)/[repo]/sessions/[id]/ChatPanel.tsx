"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/lib/components/ui/accordion";
import { Button } from "@/lib/components/ui/button";
import { Textarea } from "@/lib/components/ui/textarea";
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
  IconUser,
  IconPlayerPlay,
  IconPlayerStop,
  IconCode,
  IconMessageCircle2,
  IconClipboardList,
  IconFileText,
  IconGitPullRequest,
  IconArrowUp,
  IconWorld,
  IconSparkles,
  IconSend,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ModelSelector, type ClaudeModel } from "@/lib/components/ui/ModelSelector";
import Link from "next/link";
import Image from "next/image";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import type { FunctionReturnType } from "convex/server";

type Session = NonNullable<FunctionReturnType<typeof api.sessions.get>>;
type Message = Session["messages"][number];
type SessionMode = NonNullable<Message["mode"]>;

interface ChatPanelProps {
  sessionId: string;
  title: string;
  branchName?: string;
  prUrl?: string;
  summary?: string[];
  messages: Message[];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [mode, setMode] = useState<SessionMode>("execute");
  const [model, setModel] = useState<ClaudeModel>("sonnet");
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendToApi = useCallback(
    async (message: string, sendMode: SessionMode, sendModel: ClaudeModel) => {
      const response = await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "session/execute",
          data: { sessionId, message, mode: sendMode, model: sendModel },
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
    },
    [sessionId],
  );

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    setIsSending(true);
    try {
      await addMessage({ id: typedSessionId, role: "user", content, mode });
      await sendToApi(content, mode, model);
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 z-50">
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
            disabled={isSummarizing || !isSandboxActive || messages.length === 0}
            className="h-8 w-8 text-teal-500"
          >
            {isSummarizing ? <Spinner size="sm" /> : <IconSparkles className="size-5" />}
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
        <Accordion
          type="single"
          collapsible
          className="px-4 border-b border-neutral-200 dark:border-neutral-700"
        >
          <AccordionItem value="summary" className="border-b-0">
            <AccordionTrigger className="py-2 text-sm">
              <div className="flex flex-row gap-2 items-center text-teal-600 dark:text-teal-400">
                <IconSparkles size={14} />
                <p>Session summary</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="list-disc list-inside text-sm text-teal-600 dark:text-teal-400 space-y-1 pl-4">
                {summary.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      <div className="flex-1 overflow-y-auto scrollbar p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">
              {isSandboxActive
                ? "No messages yet. Start the conversation!"
                : "Sandbox is inactive. Start the sandbox to begin chatting."}
            </p>
          </div>
        ) : (
          messages
            .filter((m) => m.mode !== "flag")
            .map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden">
                      <Image
                        src="/icon.png"
                        alt="Assistant"
                        width={28}
                        height={28}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-500">Eva</span>
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-xl ${
                    message.role === "user"
                      ? "max-w-[85%] bg-teal-600 text-white rounded-br-none"
                      : "bg-neutral-100 dark:bg-neutral-800 rounded-tl-none"
                  }`}
                >
                  {message.role === "assistant" && !message.content ? (
                    <>
                      <pre className="text-sm whitespace-pre-wrap break-words text-neutral-500">
                        {streamingActivity || "Starting..."}
                      </pre>
                      <Spinner size="sm" className="mt-2" />
                    </>
                  ) : (
                    <>
                      {message.role === "assistant" ? (
                        <Streamdown
                          plugins={{ code }}
                          className="prose prose-sm dark:prose-invert max-w-none"
                        >
                          {message.content}
                        </Streamdown>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                      {message.role === "assistant" &&
                        message.activityLog && (
                          <Accordion type="single" collapsible className="mt-2 px-0">
                            <AccordionItem value="logs" className="border-b-0">
                              <AccordionTrigger className="py-1 text-xs text-neutral-500">
                                View logs
                              </AccordionTrigger>
                              <AccordionContent className="pb-2 overflow-hidden">
                                <pre className="text-xs whitespace-pre-wrap break-all text-neutral-500 max-h-60 overflow-y-auto w-0 min-w-full">
                                  {message.activityLog}
                                </pre>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                    </>
                  )}
                </div>
                {message.mode && message.role === "user" && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
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
                  <div className="mt-1.5">
                    {message.userId ? (
                      <UserInitials
                        userId={message.userId}
                        hideLastSeen
                        size="md"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                        <IconUser className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
        )}
        {isSending && (
          <div className="flex gap-3">
            <Spinner size="sm" />
            <span className="text-sm text-neutral-500">Sending...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-3 pb-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Tabs value={mode} onValueChange={(v) => setMode(v as SessionMode)}>
              <TabsList>
                <TabsTrigger value="execute">
                  <div className="flex items-center gap-1">
                    <IconCode className="w-3 h-3" />
                    <span className="text-xs">Execute</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="ask">
                  <div className="flex items-center gap-1">
                    <IconMessageCircle2 className="size-3" />
                    <span className="text-xs">Ask</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="plan">
                  <div className="flex items-center gap-1">
                    <IconClipboardList className="w-3 h-3" />
                    <span className="text-xs">Plan</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {mode === "plan" && planContent && (
              <Button
                size="sm"
                variant="secondary"
                className="text-green-600"
                onClick={() => setShowPlanModal(true)}
              >
                <IconFileText className="w-3 h-3" />
                View Plan
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
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
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !isSandboxActive
                  ? "Start the sandbox to begin chatting..."
                  : mode === "execute"
                    ? "Describe the changes to make to Eva..."
                    : mode === "ask"
                      ? "Ask Eva a question about the codebase..."
                      : "Describe what you want to build to Eva..."
              }
              rows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border-0 focus-visible:ring-0"
              disabled={isInputDisabled}
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <ModelSelector value={model} onChange={setModel} isDisabled={isInputDisabled} />
              {isExecuting ? (
                <Button
                  size="icon"
                  variant="destructive"
                  className="rounded-full h-8 w-8"
                  onClick={handleCancel}
                >
                  <IconPlayerStop size={16} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  disabled={isInputDisabled || !input.trim()}
                >
                  {isSending ? <Spinner size="sm" /> : <IconArrowUp size={16} />}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
      <Dialog open={showReviewModal} onOpenChange={(v) => { if (!v) setShowReviewModal(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send for Code Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            By clicking this you confirm that all your changes have been
            tested in your session, you are happy with those changes, have
            generated a summary and agree with the changes. A developer will
            then review the code changes Eva has made and get in contact to
            confirm if they are happy before merging into staging/production.
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
      <Dialog open={showPlanModal} onOpenChange={(v) => { if (!v) setShowPlanModal(false); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Implementation Plan</DialogTitle>
          </DialogHeader>
          <Streamdown
            plugins={{ code }}
            className="prose prose-sm dark:prose-invert max-w-none"
          >
            {planContent}
          </Streamdown>
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
