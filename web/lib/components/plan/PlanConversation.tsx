"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import {
  PLAN_SYSTEM_PROMPT,
  SPEC_GENERATION_PROMPT,
  INTERVIEW_PROMPT,
} from "@/lib/prompts/planPrompts";
import {
  IconSend,
  IconHelpCircle,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

type PlanState = "draft" | "finalized" | "feature_created";

interface PlanConversationProps {
  planId: Id<"plans">;
  planState: PlanState;
  initialMessages: ConversationMessage[];
  onSpecGenerated?: (spec: string) => void;
}

export function PlanConversation({
  planId,
  planState,
  initialMessages,
  onSpecGenerated,
}: PlanConversationProps) {
  const addMessage = useMutation(api.plans.addMessage);
  const clearMessagesDb = useMutation(api.plans.clearMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const isLocked = planState === "feature_created";
  const isFinalized = planState === "finalized";
  const canEdit = planState === "draft";

  const { messages, sendMessage, status, setMessages } = useChat({
    id: `plan-${planId}`,
    messages: initialMessages.map((m, i) => ({
      id: `initial-${i}`,
      role: m.role,
      parts: [{ type: "text" as const, text: m.content }],
    })),
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { systemPrompt: PLAN_SYSTEM_PROMPT },
    }),
    onFinish: async ({ message }) => {
      const content = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      await addMessage({
        id: planId,
        role: "assistant",
        content,
      });
      if (content.includes("\"title\"") && content.includes("\"tasks\"")) {
        const jsonMatch = content.match(/{[sS]*}/);
        if (jsonMatch) {
          onSpecGenerated?.(jsonMatch[0]);
        }
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleAskMoreQuestions = async () => {
    const prompt = INTERVIEW_PROMPT;
    await addMessage({ id: planId, role: "user", content: prompt });
    sendMessage({ parts: [{ type: "text", text: prompt }] });
  };

  const handleGenerateSpec = async () => {
    const prompt = SPEC_GENERATION_PROMPT;
    await addMessage({ id: planId, role: "user", content: prompt });
    sendMessage({ parts: [{ type: "text", text: prompt }] });
  };

  const handleClearChat = async () => {
    await clearMessagesDb({ id: planId });
    setMessages([]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input.trim();
    setInput("");
    await addMessage({
      id: planId,
      role: "user",
      content,
    });
    sendMessage({ parts: [{ type: "text", text: content }] });
  };

  const getMessageContent = (m: typeof messages[number]): string => {
    return m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            role={m.role as "user" | "assistant"}
            content={getMessageContent(m)}
          />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <Spinner size="sm" />
            <span className="text-sm text-default-500">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-divider p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Tooltip
            content={
              isLocked
                ? "Feature already created - plan is locked"
                : isFinalized
                  ? "Spec is finalized - create feature or continue editing"
                  : "Ask AI to gather more requirements"
            }
            isDisabled={canEdit && !isLoading}
          >
            <span>
              <Button
                size="sm"
                variant="flat"
                startContent={<IconHelpCircle size={16} />}
                onPress={handleAskMoreQuestions}
                isDisabled={isLoading || isLocked}
              >
                Ask More Questions
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            content={
              isLocked
                ? "Feature already created - plan is locked"
                : isFinalized
                  ? "Spec already generated - create feature to proceed"
                  : "Generate implementation spec from conversation"
            }
            isDisabled={canEdit && !isLoading}
          >
            <span>
              <Button
                size="sm"
                variant="flat"
                color="success"
                startContent={<IconSparkles size={16} />}
                onPress={handleGenerateSpec}
                isDisabled={isLoading || isLocked}
              >
                Generate Spec
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            content={
              isLocked
                ? "Feature already created - plan is locked"
                : isFinalized
                  ? "Spec is finalized - cannot clear conversation"
                  : messages.length === 0
                    ? "No messages to clear"
                    : "Clear all messages"
            }
            isDisabled={canEdit && messages.length > 0 && !isLoading}
          >
            <span>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                startContent={<IconTrash size={16} />}
                onPress={handleClearChat}
                isDisabled={isLoading || isLocked || isFinalized || messages.length === 0}
              >
                Clear Chat
              </Button>
            </span>
          </Tooltip>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="flex gap-2">
            <Tooltip
              content={
                isLocked
                  ? "Feature already created - plan is locked"
                  : isFinalized
                    ? "Spec is finalized - you can still add messages"
                    : ""
              }
              isDisabled={canEdit}
            >
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isLocked
                      ? "Plan is locked - feature has been created"
                      : "Describe your feature or answer questions..."
                  }
                  minRows={1}
                  maxRows={4}
                  isDisabled={isLocked}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isLocked) {
                      e.preventDefault();
                      handleFormSubmit(
                        e as unknown as React.FormEvent<HTMLFormElement>
                      );
                    }
                  }}
                />
              </div>
            </Tooltip>
            <Tooltip
              content={
                isLocked
                  ? "Feature already created - plan is locked"
                  : !input.trim()
                    ? "Enter a message first"
                    : "Send message"
              }
              isDisabled={!isLocked && input.trim().length > 0}
            >
              <span>
                <Button
                  type="submit"
                  isIconOnly
                  color="primary"
                  isLoading={isLoading}
                  isDisabled={!input.trim() || isLocked}
                >
                  <IconSend size={18} />
                </Button>
              </span>
            </Tooltip>
          </div>
        </form>
      </div>
    </div>
  );
}
