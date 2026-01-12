"use client";

import { useChat } from "ai/react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import {
  PLAN_SYSTEM_PROMPT,
  SPEC_GENERATION_PROMPT,
  INTERVIEW_PROMPT,
} from "@/lib/prompts/planPrompts";
import { Send, HelpCircle, Sparkles } from "lucide-react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface PlanConversationProps {
  planId: Id<"plans">;
  initialMessages: ConversationMessage[];
  onSpecGenerated?: (spec: string) => void;
}

export function PlanConversation({
  planId,
  initialMessages,
  onSpecGenerated,
}: PlanConversationProps) {
  const addMessage = useMutation(api.plans.addMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: "/api/chat",
      body: {
        systemPrompt: PLAN_SYSTEM_PROMPT,
      },
      initialMessages: initialMessages.map((m, i) => ({
        id: `initial-${i}`,
        role: m.role,
        content: m.content,
      })),
      onFinish: async (message) => {
        await addMessage({
          id: planId,
          role: "assistant",
          content: message.content,
        });
        if (message.content.includes('"title"') && message.content.includes('"tasks"')) {
          const jsonMatch = message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            onSpecGenerated?.(jsonMatch[0]);
          }
        }
      },
    });

  const handleAskMoreQuestions = async () => {
    const prompt = INTERVIEW_PROMPT;
    await addMessage({ id: planId, role: "user", content: prompt });
    append({ role: "user", content: prompt });
  };

  const handleGenerateSpec = async () => {
    const prompt = SPEC_GENERATION_PROMPT;
    await addMessage({ id: planId, role: "user", content: prompt });
    append({ role: "user", content: prompt });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    await addMessage({
      id: planId,
      role: "user",
      content: input,
    });
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m) => (
          <ChatMessage key={m.id} role={m.role as "user" | "assistant"} content={m.content} />
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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            startContent={<HelpCircle size={16} />}
            onPress={handleAskMoreQuestions}
            isDisabled={isLoading}
          >
            Ask More Questions
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="success"
            startContent={<Sparkles size={16} />}
            onPress={handleGenerateSpec}
            isDisabled={isLoading}
          >
            Generate Spec
          </Button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Describe your feature or answer questions..."
              minRows={1}
              maxRows={4}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                }
              }}
            />
            <Button
              type="submit"
              isIconOnly
              color="primary"
              isLoading={isLoading}
              isDisabled={!input.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
