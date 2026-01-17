"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import {
  IconSend,
  IconGitBranch,
  IconExternalLink,
  IconUser,
  IconPlayerPlay,
  IconPlayerStop,
  IconCode,
  IconMessageQuestion,
  IconClipboardList,
  IconFileText,
  IconEye,
  IconGitPullRequest,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRepo } from "@/lib/contexts/RepoContext";

interface SessionDetailClientProps {
  sessionId: string;
}

type SessionMode = "execute" | "ask" | "plan";

export function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const typedSessionId = sessionId as Id<"sessions">;
  const session = useQuery(api.sessions.get, { id: typedSessionId });
  const { repo } = useRepo();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSandboxToggling, setIsSandboxToggling] = useState(false);
  const [mode, setMode] = useState<SessionMode>("execute");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

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

  const handleSandboxToggle = async (action: "start" | "stop") => {
    setIsSandboxToggling(true);
    try {
      const response = await fetch("/api/sessions/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action }),
      });
      if (!response.ok) {
        throw new Error("Failed to toggle sandbox");
      }
    } finally {
      setIsSandboxToggling(false);
    }
  };

  const isSandboxActive = session?.status === "active";
  const isInputDisabled = !isSandboxActive || isSending;

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-neutral-500">
            This session does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {session.title}
          </h1>
          <div
            className={`w-3 h-3 rounded-full ${isSandboxActive ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
            title={isSandboxActive ? "Active" : "Inactive"}
          />
        </div>
        <div className="flex items-center gap-3">
          {session.branchName && (
            <Link
              href={
                session.prUrl ||
                `https://github.com/${repo.owner}/${repo.name}/tree/${session.branchName}`
              }
              target="_blank"
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
            >
              <IconGitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">{session.branchName}</span>
              {session.prUrl && (
                <Chip size="sm" color="success" variant="flat" className="ml-1">
                  PR
                </Chip>
              )}
            </Link>
          )}
          <Button
            size="sm"
            color={isSandboxActive ? "danger" : "success"}
            variant="flat"
            onPress={() => handleSandboxToggle(isSandboxActive ? "stop" : "start")}
            isLoading={isSandboxToggling}
            startContent={
              isSandboxActive ? (
                <IconPlayerStop className="w-4 h-4" />
              ) : (
                <IconPlayerPlay className="w-4 h-4" />
              )
            }
          >
            {isSandboxActive ? "Stop" : "Start"}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {session.messages.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p>
              {isSandboxActive
                ? "No messages yet. Start the conversation!"
                : "Sandbox is inactive. Start the sandbox to begin chatting."}
            </p>
          </div>
        ) : (
          session.messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                  <Image src="/icon.png" alt="Assistant" width={32} height={32} />
                </div>
              )}
              <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-xl ${
                    message.role === "user"
                      ? "bg-pink-600 text-white"
                      : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
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
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        {(session.sandboxId || session.branchName || session.prUrl) && (
          <div className="flex items-center gap-2 mb-3">
            {session.sandboxId && (
              <Button
                as={Link}
                href={`https://${session.sandboxId}.e2b.dev`}
                target="_blank"
                size="sm"
                variant="flat"
                startContent={<IconEye className="w-3 h-3" />}
              >
                View Preview
              </Button>
            )}
            {session.prUrl && (
              <Button
                as={Link}
                href={session.prUrl}
                target="_blank"
                size="sm"
                variant="flat"
                startContent={<IconGitPullRequest className="w-3 h-3" />}
              >
                View PR
              </Button>
            )}
            {session.branchName && (
              <Button
                as={Link}
                href={`https://github.com/${repo.owner}/${repo.name}/tree/${session.branchName}`}
                target="_blank"
                size="sm"
                variant="flat"
                startContent={<IconGitBranch className="w-3 h-3" />}
              >
                View Branch
              </Button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <Button
            size="sm"
            variant={mode === "execute" ? "solid" : "flat"}
            color={mode === "execute" ? "primary" : "default"}
            onPress={() => setMode("execute")}
            startContent={<IconCode className="w-3 h-3" />}
          >
            Execute
          </Button>
          <Button
            size="sm"
            variant={mode === "ask" ? "solid" : "flat"}
            color={mode === "ask" ? "primary" : "default"}
            onPress={() => setMode("ask")}
            startContent={<IconMessageQuestion className="w-3 h-3" />}
          >
            Ask
          </Button>
          <Button
            size="sm"
            variant={mode === "plan" ? "solid" : "flat"}
            color={mode === "plan" ? "primary" : "default"}
            onPress={() => setMode("plan")}
            startContent={<IconClipboardList className="w-3 h-3" />}
          >
            Plan
          </Button>
          {mode === "plan" && session.messages.some((m) => m.mode === "plan") && (
            <Button
              size="sm"
              variant="flat"
              color="success"
              onPress={handleGeneratePlan}
              isLoading={isSending}
              isDisabled={isInputDisabled}
              startContent={<IconFileText className="w-3 h-3" />}
            >
              Generate Plan
            </Button>
          )}
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
              minRows={3}
              maxRows={6}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
              isDisabled={isInputDisabled}
            />
            <Button
              type="submit"
              isIconOnly
              color="primary"
              isLoading={isSending}
              isDisabled={isInputDisabled || !input.trim()}
            >
              <IconSend size={18} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
