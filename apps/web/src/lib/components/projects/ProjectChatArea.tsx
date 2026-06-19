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
  type PromptInputMessage,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import {
  api,
  AI_MODEL_OPTIONS,
  DEFAULT_AI_MODEL,
  type AIModel,
  type Id,
} from "@conductor/backend";
import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import type { ConversationMessage } from "@/lib/components/projects/ProjectChatTab";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useTypingPresence } from "@/lib/hooks/useTypingPresence";
import { TypingIndicator } from "@/lib/components/chat/TypingIndicator";

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
  const [model, setModel] = useState<AIModel>(DEFAULT_AI_MODEL);
  const currentUserId = useQuery(api.auth.me);
  const { typingUsers, onActivity, stopTyping } = useTypingPresence(
    `typing:project:${projectId}`,
    currentUserId,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory]);

  const handleSubmit = async ({ text }: PromptInputMessage) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    stopTyping();
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
      <div className="relative p-3">
        <TypingIndicator
          users={typingUsers}
          className="absolute bottom-full left-3 mb-1"
        />
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder={
              selectedTaskTitle
                ? `Discuss "${selectedTaskTitle}"...`
                : "Send a message..."
            }
            disabled={isSending}
            onChange={onActivity}
          />
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelect
                value={model}
                options={AI_MODEL_OPTIONS}
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
