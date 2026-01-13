"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { ChatMessage } from "./ChatMessage";
import {
  MC_INITIAL_QUESTIONS,
  MC_FOLLOWUP_QUESTIONS,
  SPEC_GENERATION_PROMPT,
} from "@/lib/prompts/planPrompts";
import { IconSparkles, IconTrash, IconPlayerPlay } from "@tabler/icons-react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

type PlanState = "draft" | "finalized" | "feature_created";

interface ParsedQuestion {
  question: string;
  options: string[];
}

interface ChatTabProps {
  planId: Id<"plans">;
  planState: PlanState;
  initialMessages: ConversationMessage[];
  rawInput: string;
  onSpecGenerated?: (spec: string) => void;
  isInterview?: boolean;
}

function parseQuestionFromMessage(content: string): ParsedQuestion | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.question && Array.isArray(parsed.options)) {
        return { question: parsed.question, options: parsed.options };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function getMessageContent(message: {
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
}): string {
  if (message.parts) {
    return message.parts
      .filter(
        (p): p is { type: "text"; text: string } =>
          p.type === "text" && typeof p.text === "string"
      )
      .map((p) => p.text)
      .join("");
  }
  return message.content || "";
}

export function ChatTab({
  planId,
  planState,
  initialMessages,
  rawInput,
  onSpecGenerated,
  isInterview = false,
}: ChatTabProps) {
  const addMessageDb = useMutation(api.plans.addMessage);
  const clearMessagesDb = useMutation(api.plans.clearMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(initialMessages.length > 1);
  const [currentQuestion, setCurrentQuestion] = useState<ParsedQuestion | null>(null);
  const systemPromptRef = useRef("");
  const pendingQuestionRef = useRef<string | null>(null);

  const isLocked = planState === "feature_created";
  const maxQuestions = 10;
  const questionList = isInterview ? MC_FOLLOWUP_QUESTIONS : MC_INITIAL_QUESTIONS;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages: messages.map((m) => ({
              role: m.role,
              content: getMessageContent(m),
            })),
            systemPrompt: systemPromptRef.current,
          },
        }),
      }),
    []
  );

  const { messages, status, sendMessage, setMessages } = useChat({
    id: `plan-chat-${planId}`,
    transport,
    onFinish: async ({ message }) => {
      const content = getMessageContent(message);
      await addMessageDb({ id: planId, role: "assistant", content });

      const parsed = parseQuestionFromMessage(content);
      if (parsed) {
        setCurrentQuestion(parsed);
        setQuestionCount((prev) => prev + 1);
      }

      if (content.includes('"title"') && content.includes('"tasks"')) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          onSpecGenerated?.(jsonMatch[0]);
        }
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(
        initialMessages.map((m, i) => ({
          id: `init-${i}`,
          role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
        }))
      );
      const assistantMessages = initialMessages.filter((m) => m.role === "assistant");
      const lastAssistant = assistantMessages[assistantMessages.length - 1];
      if (lastAssistant) {
        const parsed = parseQuestionFromMessage(lastAssistant.content);
        if (parsed) {
          setCurrentQuestion(parsed);
        }
      }
      setQuestionCount(assistantMessages.length);
    }
  }, []);

  const askQuestion = useCallback(
    async (questionIndex: number, userMessage?: string) => {
      if (questionIndex >= maxQuestions) return;

      setCurrentQuestion(null);
      const questionTemplate = questionList[questionIndex % questionList.length];

      systemPromptRef.current = `You are helping gather requirements for this feature: "${rawInput}".
Generate a multiple choice question about: "${questionTemplate}"
Respond with ONLY a JSON object in this format:
{"question": "Your specific question based on the topic?", "options": ["Option A", "Option B", "Option C", "Option D"]}`;

      const messageContent = userMessage || rawInput;
      await addMessageDb({ id: planId, role: "user", content: messageContent });
      sendMessage({ parts: [{ type: "text", text: messageContent }] });
    },
    [rawInput, planId, addMessageDb, sendMessage, questionList]
  );

  const handleStartInterview = async () => {
    setHasStarted(true);
    await askQuestion(0);
  };

  const handleAnswer = async (answer: string) => {
    setCurrentQuestion(null);
    await addMessageDb({ id: planId, role: "user", content: answer });

    const nextQuestionIndex = questionCount;
    if (nextQuestionIndex < maxQuestions) {
      const questionTemplate = questionList[nextQuestionIndex % questionList.length];
      systemPromptRef.current = `You are helping gather requirements for this feature: "${rawInput}".
The user answered the previous question with: "${answer}"
Generate a multiple choice question about: "${questionTemplate}"
Respond with ONLY a JSON object in this format:
{"question": "Your specific question based on the topic?", "options": ["Option A", "Option B", "Option C", "Option D"]}`;

      sendMessage({ parts: [{ type: "text", text: answer }] });
    }
  };

  const handleGenerateSpec = async () => {
    setCurrentQuestion(null);
    await addMessageDb({ id: planId, role: "user", content: SPEC_GENERATION_PROMPT });

    systemPromptRef.current = `Generate an implementation spec based on the conversation. Output ONLY valid JSON with this structure:
{
  "title": "Feature title",
  "description": "Feature description",
  "tasks": [
    {"title": "Task 1", "description": "What to do", "dependencies": []},
    {"title": "Task 2", "description": "What to do", "dependencies": [1]}
  ]
}`;

    sendMessage({ parts: [{ type: "text", text: SPEC_GENERATION_PROMPT }] });
  };

  const handleClearChat = async () => {
    await clearMessagesDb({ id: planId });
    setMessages([]);
    setQuestionCount(0);
    setHasStarted(false);
    setCurrentQuestion(null);
  };

  const canGenerateSpec = questionCount >= maxQuestions;

  if (!hasStarted && !isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <IconPlayerPlay size={32} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">
          Ready to Start Interview
        </h3>
        <p className="text-sm text-default-500 mb-6 max-w-md">
          Click the button below to start answering questions about your feature. The AI
          will ask {maxQuestions} multiple choice questions to understand your
          requirements. You can also provide custom answers.
        </p>
        <Button
          color="primary"
          size="lg"
          startContent={<IconPlayerPlay size={20} />}
          onPress={handleStartInterview}
          isLoading={isLoading}
        >
          Start Interview
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((m, i) => {
          const content = getMessageContent(m);
          const isLast = i === messages.length - 1;
          const question = m.role === "assistant" ? parseQuestionFromMessage(content) : null;

          if (question && !isLast) {
            return (
              <ChatMessage
                key={m.id}
                role="assistant"
                content={`Q: ${question.question}`}
              />
            );
          }

          if (isLast && m.role === "assistant" && question) {
            return null;
          }

          return (
            <ChatMessage
              key={m.id}
              role={m.role as "user" | "assistant"}
              content={content}
            />
          );
        })}
        {isLoading && (
          <div className="flex gap-3 items-center">
            <Spinner size="sm" />
            <span className="text-sm text-default-500">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-divider p-4 space-y-3">
        {currentQuestion && !isLocked && questionCount <= maxQuestions && (
          <MultipleChoiceQuestion
            question={currentQuestion.question}
            options={currentQuestion.options}
            onAnswer={handleAnswer}
            isLoading={isLoading}
            questionNumber={questionCount}
            totalQuestions={maxQuestions}
          />
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-400">
            Questions: {questionCount}/{maxQuestions}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              color="danger"
              startContent={<IconTrash size={16} />}
              onPress={handleClearChat}
              isDisabled={isLoading || isLocked || messages.length === 0}
            >
              Clear
            </Button>
            {canGenerateSpec && (
              <Button
                size="sm"
                color="success"
                startContent={<IconSparkles size={16} />}
                onPress={handleGenerateSpec}
                isDisabled={isLoading || isLocked}
              >
                Generate Plan
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
