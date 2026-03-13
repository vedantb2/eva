"use client";

import { useEffect, useRef, useState } from "react";
import {
  Spinner,
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  ModelSelect,
  type ClaudeModel,
  type PromptInputMessage,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import type { ConversationMessage } from "@/lib/components/projects/ProjectChatTab";

interface ProjectChatAreaProps {
  projectId: Id<"projects">;
  conversationHistory: ConversationMessage[];
  selectedTaskTitle?: string;
}

export function ProjectChatArea({
  projectId,
  conversationHistory,
  selectedTaskTitle,
}: ProjectChatAreaProps) {
  const addMessage = useMutation(api.projects.addMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [model, setModel] = useState<ClaudeModel>("sonnet");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory]);

  const handleSubmit = async ({ text }: PromptInputMessage) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      await addMessage({ id: projectId, role: "user", content: trimmed });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-3 p-3">
          {conversationHistory.length === 0 ? (
            <ConversationEmptyState title="No messages yet" />
          ) : (
            conversationHistory.map((m, i) => (
              <ChatMessage key={`msg-${i}`} role={m.role} content={m.content} />
            ))
          )}
          {isSending && (
            <div className="flex gap-3 items-center">
              <Spinner size="sm" />
              <span className="text-sm text-muted-foreground">Sending...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder={
              selectedTaskTitle
                ? `Discuss "${selectedTaskTitle}"...`
                : "Send a message..."
            }
            disabled={isSending}
          />
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelect
                value={model}
                onValueChange={setModel}
                disabled={isSending}
              />
            </PromptInputTools>
            <PromptInputSubmit disabled={isSending} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
