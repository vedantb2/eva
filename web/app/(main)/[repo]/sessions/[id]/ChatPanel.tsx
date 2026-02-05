"use client";

import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { useCallback, useEffect, useRef, useState } from "react";
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
    async (message: string, sendMode: SessionMode) => {
      const response = await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "session/execute",
          data: { sessionId, message, mode: sendMode },
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
      await sendToApi(content, mode);
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
              color="success"
              variant="flat"
              startContent={<IconSend size={12} />}
              onPress={() => setShowReviewModal(true)}
            >
              Send for Review
            </Button>
          )}
          <Button
            size="sm"
            variant="flat"
            onPress={handleGenerateSummary}
            isLoading={isSummarizing}
            isDisabled={!isSandboxActive || messages.length === 0}
            className="text-teal-500"
            isIconOnly
          >
            <IconSparkles className="size-5" />
          </Button>
          <Button
            size="sm"
            color={isSandboxActive ? "danger" : "success"}
            variant="flat"
            onPress={() => onSandboxToggle(isSandboxActive ? "stop" : "start")}
            isLoading={isSandboxToggling}
            isIconOnly
          >
            {isSandboxActive ? (
              <IconPlayerStop className="w-4 h-4" />
            ) : (
              <IconPlayerPlay className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      {summary && summary.length > 0 && (
        <Accordion
          selectionMode="single"
          className="px-4 border-b border-neutral-200 dark:border-neutral-700"
          isCompact
        >
          <AccordionItem
            key="summary"
            title={
              <div className="flex flex-row gap-2 items-center text-teal-600 dark:text-teal-400">
                <IconSparkles size={14} />
                <p>Session summary</p>
              </div>
            }
            classNames={{
              title: "text-sm",
              trigger: "py-2",
              content: "pb-2",
            }}
          >
            <ul className="list-disc list-inside text-sm text-teal-600 dark:text-teal-400 space-y-1 pl-4">
              {summary.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
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
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                    <Image
                      src="/icon.png"
                      alt="Assistant"
                      width={28}
                      height={28}
                    />
                  </div>
                )}
                <div
                  className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl ${
                      message.role === "user"
                        ? "bg-teal-600 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800"
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
                            <Accordion isCompact className="mt-2 px-0">
                              <AccordionItem
                                key="logs"
                                title="View logs"
                                classNames={{
                                  title: "text-xs text-neutral-500",
                                  trigger: "py-1",
                                  content: "pb-2 overflow-hidden",
                                }}
                              >
                                <pre className="text-xs whitespace-pre-wrap break-all text-neutral-500 max-h-60 overflow-y-auto w-0 min-w-full">
                                  {message.activityLog}
                                </pre>
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
                </div>
                {message.role === "user" &&
                  (message.userId ? (
                    <UserInitials
                      userId={message.userId}
                      hideLastSeen
                      size="md"
                    />
                  ) : (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      <IconUser className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                    </div>
                  ))}
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
            <Tabs
              size="sm"
              selectedKey={mode}
              onSelectionChange={(key) => setMode(key as SessionMode)}
            >
              <Tab
                key="execute"
                title={
                  <div className="flex items-center gap-1">
                    <IconCode className="w-3 h-3" />
                    <span className="text-xs">Execute</span>
                  </div>
                }
              />
              <Tab
                key="ask"
                title={
                  <div className="flex items-center gap-1">
                    <IconMessageCircle2 className="size-3" />
                    <span className="text-xs">Ask</span>
                  </div>
                }
              />
              <Tab
                key="plan"
                title={
                  <div className="flex items-center gap-1">
                    <IconClipboardList className="w-3 h-3" />
                    <span className="text-xs">Plan</span>
                  </div>
                }
              />
            </Tabs>
            {mode === "plan" && planContent && (
              <Button
                size="sm"
                variant="flat"
                color="success"
                onPress={() => setShowPlanModal(true)}
                startContent={<IconFileText className="w-3 h-3" />}
              >
                View Plan
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {prUrl && (
              <Chip
                variant="faded"
                size="sm"
                startContent={<IconGitPullRequest size={12} className="ml-1" />}
                as={Link}
                href={prUrl}
                target="_blank"
              >
                View PR
              </Chip>
            )}
            <Chip
              variant="faded"
              size="sm"
              startContent={<IconWorld size={12} className="ml-1" />}
              as={Link}
              href={
                prUrl ??
                `https://github.com/${repo.owner}/${repo.name}/tree/${branchName}`
              }
            >
              View Preview
            </Chip>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex gap-2 items-end bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg">
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
              minRows={4}
              maxRows={6}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              classNames={{
                inputWrapper:
                  "bg-neutral-100 hover:bg-neutral-200  dark:bg-neutral-800 dark:hover:bg-neutral-700",
              }}
              isDisabled={isInputDisabled}
            />
            {isExecuting ? (
              <Button
                isIconOnly
                className="mt-auto mr-2 mb-2"
                color="danger"
                radius="full"
                onPress={handleCancel}
                size="sm"
              >
                <IconPlayerStop size={16} />
              </Button>
            ) : (
              <Button
                type="submit"
                isIconOnly
                className="mt-auto mr-2 mb-2"
                color="primary"
                radius="full"
                isLoading={isSending}
                isDisabled={isInputDisabled || !input.trim()}
                size="sm"
              >
                <IconArrowUp size={16} />
              </Button>
            )}
          </div>
        </form>
      </div>
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>Send for Code Review</ModalHeader>
          <ModalBody>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              By clicking this you confirm that all your changes have been
              tested in your session, you are happy with those changes, have
              generated a summary and agree with the changes. A developer will
              then review the code changes Eva has made and get in contact to
              confirm if they are happy before merging into staging/production.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button
              color="success"
              onPress={handleCreatePr}
              isLoading={isCreatingPr}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Implementation Plan</ModalHeader>
          <ModalBody>
            <Streamdown
              plugins={{ code }}
              className="prose prose-sm dark:prose-invert max-w-none"
            >
              {planContent}
            </Streamdown>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowPlanModal(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
