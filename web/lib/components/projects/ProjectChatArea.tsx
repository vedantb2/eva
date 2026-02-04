"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import { IconArrowUp, IconMessageCircle } from "@tabler/icons-react";
import type { ConversationMessage } from "@/lib/components/projects/ProjectChatTab";

interface ProjectChatAreaProps {
  projectId: Id<"projects">;
  conversationHistory: ConversationMessage[];
}

export function ProjectChatArea({
  projectId,
  conversationHistory,
}: ProjectChatAreaProps) {
  const addMessage = useMutation(api.projects.addMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput("");
    setIsSending(true);
    try {
      await addMessage({ id: projectId, role: "user", content: trimmed });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar space-y-3 p-4">
        {conversationHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <IconMessageCircle
              size={32}
              className="text-neutral-300 dark:text-neutral-600 mb-2"
            />
            <p className="text-sm text-neutral-400">No messages yet</p>
          </div>
        )}
        {conversationHistory.map((m, i) => (
          <ChatMessage key={`msg-${i}`} role={m.role} content={m.content} />
        ))}
        {isSending && (
          <div className="flex gap-3 items-center">
            <Spinner size="sm" />
            <span className="text-sm text-default-500">Sending...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t dark:border-neutral-700 p-3">
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
              placeholder="Send a message..."
              minRows={3}
              maxRows={6}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              classNames={{
                inputWrapper:
                  "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700",
              }}
              isDisabled={isSending}
            />
            <Button
              type="submit"
              isIconOnly
              className="mt-auto mr-2 mb-2"
              color="primary"
              radius="full"
              isLoading={isSending}
              isDisabled={!input.trim()}
              size="sm"
            >
              <IconArrowUp size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
