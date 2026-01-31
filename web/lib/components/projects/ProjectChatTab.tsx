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
  MC_INITIAL_QUESTIONS,
  MC_FOLLOWUP_QUESTIONS,
} from "@/lib/prompts/planPrompts";
import {
  IconSparkles,
  IconTrash,
  IconPlayerPlay,
  IconCode,
} from "@tabler/icons-react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

type ProjectPhase = "draft" | "finalized" | "active" | "completed";
type IndexingStatus = "pending" | "indexing" | "complete" | "error" | undefined;

interface ProjectChatTabProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  initialMessages: ConversationMessage[];
  rawInput: string;
  codebaseIndex: string | undefined;
  indexingStatus: IndexingStatus;
  onSpecGenerated?: (spec: string) => void;
  isInterview?: boolean;
  repoId: Id<"githubRepos">;
  installationId: number;
}

interface AnswerRecord {
  question: string;
  answer: string;
}

interface ParsedQuestion {
  question: string;
  options: string[];
}

export function ProjectChatTab({
  projectId,
  projectPhase,
  initialMessages,
  rawInput,
  codebaseIndex,
  indexingStatus,
  onSpecGenerated,
  isInterview = false,
  repoId,
  installationId,
}: ProjectChatTabProps) {
  const addMessageDb = useMutation(api.projects.addMessage);
  const clearMessagesDb = useMutation(api.projects.clearMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(initialMessages.length > 1);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuestionRequest, setPendingQuestionRequest] = useState(false);
  const [pendingSpecRequest, setPendingSpecRequest] = useState(false);
  const prevMessagesLengthRef = useRef(initialMessages.length);

  const isLocked = projectPhase === "active" || projectPhase === "completed";
  const minQuestions = 3;
  const maxQuestions = 10;
  const questionList = isInterview
    ? MC_FOLLOWUP_QUESTIONS
    : MC_INITIAL_QUESTIONS;
  const isIndexing =
    indexingStatus === "pending" || indexingStatus === "indexing";

  const assistantMessages = initialMessages.filter(
    (m) => m.role === "assistant",
  );
  const questionCount = assistantMessages.length;

  useEffect(() => {
    if (initialMessages.length > prevMessagesLengthRef.current) {
      const newMessage = initialMessages[initialMessages.length - 1];
      if (newMessage.role === "assistant") {
        setIsLoading(false);
        setPendingQuestionRequest(false);

        try {
          const parsed = JSON.parse(newMessage.content);
          if (parsed.title && parsed.tasks) {
            setPendingSpecRequest(false);
            onSpecGenerated?.(newMessage.content);
          }
        } catch {
          // Not a spec, just a regular message
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
    async (questionIndex: number, currentAnswers: AnswerRecord[]) => {
      if (questionIndex >= maxQuestions) return;

      const questionTemplate =
        questionList[questionIndex % questionList.length];

      setIsLoading(true);
      setPendingQuestionRequest(true);

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
            questionTopic: questionTemplate,
            previousAnswers: currentAnswers,
          },
        }),
      });
    },
    [projectId, repoId, installationId, rawInput, questionList],
  );

  const handleStartInterview = async () => {
    setHasStarted(true);
    await addMessageDb({ id: projectId, role: "user", content: rawInput });
    askQuestion(0, []);
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

    const nextQuestionIndex = questionCount;
    if (nextQuestionIndex < maxQuestions) {
      askQuestion(nextQuestionIndex, updatedAnswers);
    }
  };

  const handleGenerateSpec = async () => {
    const specPrompt = "Generate implementation spec based on answers";
    await addMessageDb({ id: projectId, role: "user", content: specPrompt });

    setIsLoading(true);
    setPendingSpecRequest(true);

    await fetch("/api/inngest/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "project/interview.spec",
        data: {
          projectId,
          repoId,
          installationId,
          featureDescription: rawInput,
          answers,
        },
      }),
    });
  };

  const handleClearChat = async () => {
    await clearMessagesDb({ id: projectId });
    setHasStarted(false);
    setAnswers([]);
    setIsLoading(false);
    setPendingQuestionRequest(false);
    setPendingSpecRequest(false);
  };

  const canGenerateSpec = questionCount >= minQuestions;

  const currentQuestion: ParsedQuestion | null = (() => {
    if (isLoading || pendingQuestionRequest || pendingSpecRequest) return null;
    const lastAssistantMsg = [...initialMessages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistantMsg) return null;
    try {
      const parsed = JSON.parse(lastAssistantMsg.content);
      if (parsed.question && parsed.options) {
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
  const showQuestion =
    currentQuestion &&
    !pendingSpecRequest &&
    questionCount <= maxQuestions &&
    !waitingForResponse;

  if (isIndexing && !hasStarted && !isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mb-4">
          <IconCode size={32} className="text-default-500" />
        </div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">
          Indexing Codebase
        </h3>
        <p className="text-sm text-default-500 mb-6 max-w-md">
          Analyzing your codebase to provide context-aware questions. This
          usually takes 30-60 seconds.
        </p>
        <Spinner size="lg" />
      </div>
    );
  }

  if (indexingStatus === "error" && !hasStarted && !isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mb-4">
          <IconCode
            size={32}
            className="text-danger-600 dark:text-danger-400"
          />
        </div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">
          Indexing Failed
        </h3>
        <p className="text-sm text-default-500 mb-6 max-w-md">
          We couldn&apos;t analyze your codebase. You can still start the
          interview with generic questions.
        </p>
        <Button
          color="primary"
          size="lg"
          startContent={<IconPlayerPlay size={20} />}
          onPress={handleStartInterview}
          isLoading={isLoading}
        >
          Start Interview Anyway
        </Button>
      </div>
    );
  }

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
          project. The AI will ask up to {maxQuestions} multiple choice
          questions to understand your requirements. You can generate a plan
          after {minQuestions} questions.
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
                    content={`${parsed.question}`}
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
              return (
                <ChatMessage
                  key={`msg-${i}`}
                  role="assistant"
                  content={m.content}
                />
              );
            }
          }
          return (
            <ChatMessage key={`msg-${i}`} role="user" content={m.content} />
          );
        })}
        {(isLoading || waitingForResponse) && (
          <div className="flex gap-3 items-center">
            <Spinner size="sm" />
            <span className="text-sm text-default-500">
              {pendingSpecRequest
                ? "Generating plan..."
                : "Generating question..."}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-divider p-4 space-y-3">
        {showQuestion &&
          currentQuestion.options.every(
            (o): o is string => typeof o === "string",
          ) && (
            <MultipleChoiceQuestion
              question={currentQuestion.question}
              options={currentQuestion.options.filter(
                (o): o is string => typeof o === "string",
              )}
              onAnswer={handleAnswer}
              isLoading={isLoading}
              questionNumber={questionCount}
              totalQuestions={maxQuestions}
            />
          )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-400">
            Questions: {questionCount}/{maxQuestions} (min {minQuestions})
          </span>
          <div className="flex gap-2">
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
