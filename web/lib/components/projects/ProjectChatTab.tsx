"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import {
  IconTrash,
  IconPlayerPlay,
} from "@tabler/icons-react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

type ProjectPhase = "draft" | "finalized" | "active" | "completed";

interface ProjectChatTabProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  initialMessages: ConversationMessage[];
  rawInput: string;
  onSpecGenerated?: (spec: string) => void;
  onClear?: () => void;
  repoId: Id<"githubRepos">;
  installationId: number;
}

interface AnswerRecord {
  question: string;
  answer: string;
}

interface OptionItem {
  label: string;
  description: string;
}

interface ParsedQuestion {
  question: string;
  options: OptionItem[];
}

export function ProjectChatTab({
  projectId,
  projectPhase,
  initialMessages,
  rawInput,
  onSpecGenerated,
  onClear,
  repoId,
  installationId,
}: ProjectChatTabProps) {
  const addMessageDb = useMutation(api.projects.addMessage);
  const clearMessagesDb = useMutation(api.projects.clearMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(initialMessages.length > 1);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const prevMessagesLengthRef = useRef(initialMessages.length);

  const isLocked = projectPhase === "active" || projectPhase === "completed";

  const assistantMessages = initialMessages.filter(
    (m) => m.role === "assistant",
  );
  const questionCount = assistantMessages.length;

  useEffect(() => {
    if (initialMessages.length > prevMessagesLengthRef.current) {
      const newMessage = initialMessages[initialMessages.length - 1];
      if (newMessage.role === "assistant") {
        setIsLoading(false);

        try {
          const parsed = JSON.parse(newMessage.content);
          if (parsed.title && parsed.tasks) {
            onSpecGenerated?.(newMessage.content);
          }
        } catch {
          // Not a spec
        }
      }
    }
    prevMessagesLengthRef.current = initialMessages.length;
  }, [initialMessages, onSpecGenerated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages]);

  useEffect(() => {
    if (initialMessages.length > 0) {
      const parsedAnswers: AnswerRecord[] = [];
      for (let i = 0; i < initialMessages.length - 1; i++) {
        const msg = initialMessages[i];
        const nextMsg = initialMessages[i + 1];
        if (msg.role === "assistant" && nextMsg?.role === "user") {
          try {
            const parsed = JSON.parse(msg.content);
            if (parsed.question) {
              parsedAnswers.push({
                question: parsed.question,
                answer: nextMsg.content,
              });
            }
          } catch {
            continue;
          }
        }
      }
      setAnswers(parsedAnswers);
    }
  }, []);

  const askQuestion = useCallback(
    async (currentAnswers: AnswerRecord[]) => {
      setIsLoading(true);

      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "project/interview.question",
          data: {
            projectId,
            repoId,
            installationId,
            featureDescription: rawInput,
            previousAnswers: currentAnswers,
          },
        }),
      });
    },
    [projectId, repoId, installationId, rawInput],
  );

  const handleStartInterview = async () => {
    setHasStarted(true);
    // await addMessageDb({ id: projectId, role: "user", content: rawInput });
    askQuestion([]);
  };

  const handleAnswer = async (answer: string) => {
    const lastAssistantMsg = [...initialMessages]
      .reverse()
      .find((m) => m.role === "assistant");
    let currentQuestion = "";
    if (lastAssistantMsg) {
      try {
        const parsed = JSON.parse(lastAssistantMsg.content) as ParsedQuestion;
        currentQuestion = parsed.question || "";
      } catch {
        // ignore
      }
    }

    const newAnswer = { question: currentQuestion, answer };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    await addMessageDb({ id: projectId, role: "user", content: answer });
    askQuestion(updatedAnswers);
  };

  const handleClearChat = async () => {
    await clearMessagesDb({ id: projectId });
    setHasStarted(false);
    setAnswers([]);
    setIsLoading(false);
    onClear?.();
  };

  const isValidOption = (o: unknown): o is OptionItem =>
    typeof o === "object" && o !== null && typeof (o as OptionItem).label === "string" && typeof (o as OptionItem).description === "string";

  const currentQuestion: ParsedQuestion | null = (() => {
    if (isLoading) return null;
    const lastAssistantMsg = [...initialMessages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistantMsg) return null;
    try {
      const parsed = JSON.parse(lastAssistantMsg.content);
      if (parsed.question && Array.isArray(parsed.options) && parsed.options.every(isValidOption)) {
        return parsed as ParsedQuestion;
      }
    } catch {
      return null;
    }
    return null;
  })();

  const lastUserMsg = [...initialMessages]
    .reverse()
    .find((m) => m.role === "user");
  const waitingForResponse =
    lastUserMsg && initialMessages[initialMessages.length - 1]?.role === "user";
  const showQuestion = currentQuestion && !waitingForResponse;

  if (!hasStarted && !isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <IconPlayerPlay
            size={32}
            className="text-primary-600 dark:text-primary-400"
          />
        </div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">
          Ready to Start Interview
        </h3>
        <p className="text-sm text-default-500 mb-6 max-w-md">
          Click the button below to start answering questions about your
          project. Eva will ask multiple choice questions to understand your
          requirements, then automatically generate a plan when ready.
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
      <div className="flex-1 overflow-y-auto scrollbar space-y-3 p-4">
        {initialMessages.map((m, i) => {
          if (m.role === "assistant") {
            try {
              const parsed = JSON.parse(m.content);
              if (parsed.question) {
                return (
                  <ChatMessage
                    key={`msg-${i}`}
                    role="assistant"
                    content={parsed.question}
                  />
                );
              }
              if (parsed.title && parsed.tasks) {
                return (
                  <ChatMessage
                    key={`msg-${i}`}
                    role="assistant"
                    content={`Generated spec: ${parsed.title}`}
                  />
                );
              }
            } catch {
              // Not parseable JSON
            }
            return (
              <ChatMessage
                key={`msg-${i}`}
                role="assistant"
                content={m.content}
              />
            );
          }
          return (
            <ChatMessage key={`msg-${i}`} role="user" content={m.content} />
          );
        })}
        {(isLoading || waitingForResponse) && (
          <div className="flex gap-3 items-center">
            <Spinner size="sm" />
            <span className="text-sm text-default-500">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-divider p-4 space-y-3">
        {showQuestion && (
          <MultipleChoiceQuestion
            question={currentQuestion.question}
            options={currentQuestion.options}
            onAnswer={handleAnswer}
            isLoading={isLoading}
            questionNumber={questionCount}
          />
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-400">
            Questions answered: {questionCount}
          </span>
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<IconTrash size={16} />}
            onPress={handleClearChat}
            isDisabled={isLoading || isLocked || initialMessages.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
