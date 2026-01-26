"use client";

import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import {
  IconSend,
  IconGitBranch,
  IconUser,
  IconPlayerPlay,
  IconPlayerStop,
  IconCode,
  IconMessageQuestion,
  IconClipboardList,
  IconFileText,
  IconGitPullRequest,
} from "@tabler/icons-react";
import { Tabs, Tab } from "@heroui/tabs";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRepo } from "@/lib/contexts/RepoContext";

type SessionMode = "execute" | "ask" | "plan";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  mode?: SessionMode;
}

interface ChatPanelProps {
  sessionId: string;
  title: string;
  branchName?: string;
  prUrl?: string;
  messages: Message[];
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  onSandboxToggle: (action: "start" | "stop") => void;
}

export function ChatPanel({
  sessionId,
  title,
  branchName,
  prUrl,
  messages,
  isSandboxActive,
  isSandboxToggling,
  onSandboxToggle,
}: ChatPanelProps) {
  const { repo } = useRepo();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState<SessionMode>("execute");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (generatePlan = false) => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    setIsSending(true);
    try {
      const response = await fetch("/api/sessions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: content, mode, generatePlan }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsSending(true);
    try {
      const response = await fetch("/api/sessions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: "Generate the implementation plan based on our conversation.",
          mode: "plan",
          generatePlan: true,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }
    } finally {
      setIsSending(false);
    }
  };

  const isInputDisabled = !isSandboxActive || isSending;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
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
          {branchName && (
            <Link
              href={
                prUrl ||
                `https://github.com/${repo.owner}/${repo.name}/tree/${branchName}`
              }
              target="_blank"
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
            >
              <IconGitBranch className="w-4 h-4" />
              {prUrl && (
                <Chip size="sm" color="success" variant="flat">
                  PR
                </Chip>
              )}
            </Link>
          )}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">
              {isSandboxActive
                ? "No messages yet. Start the conversation!"
                : "Sandbox is inactive. Start the sandbox to begin chatting."}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                  <Image src="/icon.png" alt="Assistant" width={28} height={28} />
                </div>
              )}
              <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl ${
                    message.role === "user"
                      ? "bg-pink-600 text-white"
                      : "bg-white dark:bg-default-800 border border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <p className={`text-sm whitespace-pre-wrap ${message.role === "assistant" ? "dark:text-black" : ""}`}>{message.content}</p>
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
                        <IconMessageQuestion className="w-3 h-3" /> Ask
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
              {message.role === "user" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <IconUser className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
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
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-3">
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
                    <IconMessageQuestion className="w-3 h-3" />
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
            {mode === "plan" && messages.some((m) => m.mode === "plan") && (
              <Button
                size="sm"
                variant="flat"
                color="success"
                onPress={handleGeneratePlan}
                isLoading={isSending}
                isDisabled={isInputDisabled}
                startContent={<IconFileText className="w-3 h-3" />}
              >
                Generate
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {prUrl && (
              <Button
                as={Link}
                href={prUrl}
                target="_blank"
                size="sm"
                variant="light"
                isIconOnly
              >
                <IconGitPullRequest className="w-4 h-4" />
              </Button>
            )}
            {branchName && (
              <Button
                as={Link}
                href={`https://github.com/${repo.owner}/${repo.name}/tree/${branchName}`}
                target="_blank"
                size="sm"
                variant="light"
                isIconOnly
              >
                <IconGitBranch className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !isSandboxActive
                  ? "Start the sandbox to begin chatting..."
                  : mode === "execute"
                    ? "Describe changes to make..."
                    : mode === "ask"
                      ? "Ask a question about the codebase..."
                      : "Describe what you want to build..."
              }
              minRows={2}
              maxRows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
              isDisabled={isInputDisabled}
              size="sm"
            />
            <Button
              type="submit"
              isIconOnly
              color="primary"
              isLoading={isSending}
              isDisabled={isInputDisabled || !input.trim()}
              size="sm"
            >
              <IconSend size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
