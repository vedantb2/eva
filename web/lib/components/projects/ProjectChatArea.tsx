"use client";

import { useEffect, useRef, useState } from "react";
import { ModelSelector, type ClaudeModel } from "@/lib/components/ui/ModelSelector";
import { Button } from "@/lib/components/ui/button";
import { Textarea } from "@/lib/components/ui/textarea";
import { Spinner } from "@/lib/components/ui/spinner";
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
  const [model, setModel] = useState<ClaudeModel>("sonnet");

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
            <span className="text-sm text-muted-foreground">Sending...</span>
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
          <div className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="border-none bg-transparent shadow-none focus-visible:ring-0 resize-none"
              disabled={isSending}
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <ModelSelector value={model} onChange={setModel} isDisabled={isSending} />
              <Button
                type="submit"
                size="icon"
                className="rounded-full"
                disabled={!input.trim() || isSending}
              >
                {isSending ? <Spinner size="sm" /> : <IconArrowUp size={16} />}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
