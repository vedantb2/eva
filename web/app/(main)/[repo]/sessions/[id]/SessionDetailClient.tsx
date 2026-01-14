"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import {
  IconSend,
  IconGitBranch,
  IconExternalLink,
  IconPlayerStop,
  IconUser,
  IconRobot,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface SessionDetailClientProps {
  sessionId: string;
}

export function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const typedSessionId = sessionId as Id<"sessions">;
  const session = useQuery(api.sessions.get, { id: typedSessionId });
  const addMessage = useMutation(api.sessions.addMessage);
  const updateStatus = useMutation(api.sessions.updateStatus);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isActive = session?.status === "active";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !isActive) return;
    const content = input.trim();
    setInput("");
    setIsSending(true);
    try {
      await addMessage({
        id: typedSessionId,
        role: "user",
        content,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    await updateStatus({ id: typedSessionId, status: "closed" });
  };

  if (session === undefined) {
    return (
      <>
        <PageHeader title="Session" showBack />
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        </Container>
      </>
    );
  }

  if (session === null) {
    return (
      <>
        <PageHeader title="Session Not Found" showBack />
        <Container>
          <div className="text-center py-12">
            <p className="text-neutral-500">
              This session does not exist or has been deleted.
            </p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={session.title}
        showBack
        headerRight={
          <div className="flex items-center gap-3">
            {session.branchName && (
              <div className="flex items-center gap-1 text-sm text-neutral-500">
                <IconGitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">{session.branchName}</span>
              </div>
            )}
            {session.prUrl && (
              <Link
                href={session.prUrl}
                target="_blank"
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
              >
                <IconExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">View PR</span>
              </Link>
            )}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                isActive
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {session.status}
            </span>
            {isActive && (
              <Button
                size="sm"
                variant="flat"
                color="danger"
                startContent={<IconPlayerStop size={16} />}
                onPress={handleClose}
              >
                <span className="hidden sm:inline">Close Session</span>
                <span className="sm:hidden">Close</span>
              </Button>
            )}
          </div>
        }
      />
      <Container>
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl mb-4">
            {session.messages.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <p>No messages yet. Start the conversation!</p>
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      <IconRobot className="w-4 h-4 text-pink-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-xl ${
                      message.role === "user"
                        ? "bg-pink-600 text-white"
                        : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
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
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isActive
                      ? "Type your message or command..."
                      : "Session is closed"
                  }
                  minRows={1}
                  maxRows={4}
                  isDisabled={!isActive}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && isActive) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  isIconOnly
                  color="primary"
                  isLoading={isSending}
                  isDisabled={!input.trim() || !isActive}
                >
                  <IconSend size={18} />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </>
  );
}
