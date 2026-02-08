"use client";

import { useEffect, useRef, useState } from "react";
import {
  ModelSelector,
  type ClaudeModel,
} from "@/lib/components/ui/ModelSelector";
import {
  Spinner,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import { IconMessageCircle } from "@tabler/icons-react";
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
      <div className="flex-1 overflow-y-auto scrollbar space-y-3 p-4">
        {conversationHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <IconMessageCircle
              size={32}
              className="text-muted-foreground mb-2"
            />
            <p className="text-sm text-muted-foreground">No messages yet</p>
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
              <ModelSelector
                value={model}
                onChange={setModel}
                isDisabled={isSending}
              />
            </PromptInputTools>
            <PromptInputSubmit disabled={isSending} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
