"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ActivitySteps,
  Button,
  Spinner,
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import { IconTrash, IconPlayerPlay } from "@tabler/icons-react";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  activityLog?: string;
  userId?: Id<"users">;
}

interface ProjectChatTabProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  initialMessages: ConversationMessage[];
  streamingActivity?: string;
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
  streamingActivity,
  rawInput,
  onSpecGenerated,
  onClear,
  repoId,
  installationId,
}: ProjectChatTabProps) {
  const addMessageDb = useMutation(api.projects.addMessage);
  const clearMessagesDb = useMutation(api.projects.clearMessages);
  const startProjectInterview = useMutation(
    api.projectInterviewWorkflow.startInterview,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const prevMessagesLengthRef = useRef(initialMessages.length);

  const isLocked = projectPhase === "active" || projectPhase === "completed";
  const hasStarted = initialMessages.length > 0 || isLoading;

  const assistantMessages = initialMessages.filter(
    (m) => m.role === "assistant",
  );
  const questionCount = assistantMessages.length;

  const answers = useMemo(() => {
    const result: AnswerRecord[] = [];
    for (let i = 0; i < initialMessages.length - 1; i++) {
      const msg = initialMessages[i];
      const nextMsg = initialMessages[i + 1];
      if (msg.role === "assistant" && nextMsg?.role === "user") {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.question) {
            result.push({ question: parsed.question, answer: nextMsg.content });
          }
        } catch {
          continue;
        }
      }
    }
    return result;
  }, [initialMessages]);

  useEffect(() => {
    const lastMessage = initialMessages[initialMessages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.content) {
      setIsLoading(false);
      try {
        const parsed = JSON.parse(lastMessage.content);
        if (parsed.title && parsed.tasks) {
          onSpecGenerated?.(lastMessage.content);
        }
      } catch {
        // Not a spec
      }
    }
    prevMessagesLengthRef.current = initialMessages.length;
  }, [initialMessages, onSpecGenerated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages]);

  useEffect(() => {
    if (isLocked || isLoading) return;
    const hasAssistant = initialMessages.some((m) => m.role === "assistant");
    if (initialMessages.length > 0 && !hasAssistant) {
      askQuestion([]);
    }
  }, []);

  const askQuestion = useCallback(
    async (currentAnswers: AnswerRecord[]) => {
      setIsLoading(true);
      await startProjectInterview({
        projectId: projectId,
        featureDescription: rawInput,
        previousAnswers: currentAnswers,
        installationId,
      });
    },
    [projectId, installationId, rawInput, startProjectInterview],
  );

  const handleStartInterview = () => {
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

    const updatedAnswers = [...answers, { question: currentQuestion, answer }];

    await addMessageDb({ id: projectId, role: "user", content: answer });
    askQuestion(updatedAnswers);
  };

  const handleClearChat = async () => {
    await clearMessagesDb({ id: projectId });
    setIsLoading(false);
    onClear?.();
  };

  const isValidOption = (o: unknown): o is OptionItem =>
    typeof o === "object" &&
    o !== null &&
    typeof (o as OptionItem).label === "string" &&
    typeof (o as OptionItem).description === "string";

  const currentQuestion: ParsedQuestion | null = (() => {
    if (isLoading) return null;
    const lastAssistantMsg = [...initialMessages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistantMsg) return null;
    try {
      const parsed = JSON.parse(lastAssistantMsg.content);
      if (
        parsed.question &&
        Array.isArray(parsed.options) &&
        parsed.options.every(isValidOption)
      ) {
        return parsed as ParsedQuestion;
      }
    } catch {
      return null;
    }
    return null;
  })();

  const waitingForResponse =
    initialMessages.length > 0 &&
    initialMessages[initialMessages.length - 1]?.role === "user";
  const showQuestion = currentQuestion && !waitingForResponse;

  if (!hasStarted && !isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
          <IconPlayerPlay size={32} className="text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ready to Start Interview
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Click the button below to start answering questions about your
          project. Eva will ask multiple choice questions to understand your
          requirements, then automatically generate a plan when ready.
        </p>
        <Button size="lg" onClick={handleStartInterview} disabled={isLoading}>
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <IconPlayerPlay className="mr-2 h-5 w-5" />
          )}
          Start Interview
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-3 p-3">
          {initialMessages.map((m, i) => {
            if (m.role === "assistant") {
              if (!m.content) {
                const steps = parseActivitySteps(streamingActivity);
                return steps ? (
                  <ActivitySteps key={`msg-${i}`} steps={steps} isStreaming />
                ) : (
                  <ChatMessage
                    key={`msg-${i}`}
                    role="assistant"
                    content={streamingActivity || "Starting..."}
                    isStreaming
                  />
                );
              }
              try {
                const parsed = JSON.parse(m.content);
                if (parsed.question) {
                  let logs = m.activityLog;
                  const nextAssistant = initialMessages
                    .slice(i + 1)
                    .find((n) => n.role === "assistant" && n.content);
                  if (nextAssistant) {
                    try {
                      const np = JSON.parse(nextAssistant.content);
                      if (np.title && np.tasks && nextAssistant.activityLog) {
                        logs = [logs, nextAssistant.activityLog]
                          .filter(Boolean)
                          .join("\n\n");
                      }
                    } catch {}
                  }
                  return (
                    <ChatMessage
                      key={`msg-${i}`}
                      role="assistant"
                      content={parsed.question}
                      logs={logs}
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
                  logs={m.activityLog}
                />
              );
            }
            return (
              <ChatMessage
                key={`msg-${i}`}
                role="user"
                content={m.content}
                userId={m.userId}
              />
            );
          })}
          {(isLoading || waitingForResponse) &&
            !initialMessages.some(
              (m) => m.role === "assistant" && !m.content,
            ) && (
              <div className="flex gap-3 items-center">
                <Spinner size="sm" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            )}
          <div ref={messagesEndRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-3 sm:p-4 space-y-3">
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
          <span className="text-xs text-muted-foreground">
            Questions answered: {questionCount}
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearChat}
            disabled={isLoading || isLocked || initialMessages.length === 0}
          >
            <IconTrash size={16} />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
