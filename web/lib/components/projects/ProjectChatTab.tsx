"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import { ChatMessage } from "@/lib/components/plan/ChatMessage";
import { MC_INITIAL_QUESTIONS, MC_FOLLOWUP_QUESTIONS } from "@/lib/prompts/planPrompts";
import { IconSparkles, IconTrash, IconPlayerPlay, IconCode } from "@tabler/icons-react";
import { z } from "zod";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

type ProjectPhase = "draft" | "finalized" | "active" | "completed";
type IndexingStatus = "pending" | "indexing" | "complete" | "error" | undefined;

interface CodebaseIndex {
  summary: string;
  techStack: {
    language: string;
    framework: string;
    other: string[];
  };
  structure: {
    entryPoints: string[];
    keyDirectories: { path: string; purpose: string }[];
  };
  patterns: {
    componentPattern: string;
    stateManagement: string;
    apiPattern: string;
  };
  keyFiles: { path: string; purpose: string; exports: string[] }[];
  conventions: {
    naming: string;
    fileStructure: string;
    imports: string;
  };
}

interface ProjectChatTabProps {
  projectId: Id<"projects">;
  projectPhase: ProjectPhase;
  initialMessages: ConversationMessage[];
  rawInput: string;
  codebaseIndex: string | undefined;
  indexingStatus: IndexingStatus;
  onSpecGenerated?: (spec: string) => void;
  isInterview?: boolean;
}

interface AnswerRecord {
  question: string;
  answer: string;
}

const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
});

const specSchema = z.object({
  title: z.string(),
  description: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      dependencies: z.array(z.number()),
    })
  ),
});

export function ProjectChatTab({
  projectId,
  projectPhase,
  initialMessages,
  rawInput,
  codebaseIndex,
  indexingStatus,
  onSpecGenerated,
  isInterview = false,
}: ProjectChatTabProps) {
  const addMessageDb = useMutation(api.projects.addMessage);
  const clearMessagesDb = useMutation(api.projects.clearMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(initialMessages.length > 1);
  const [displayMessages, setDisplayMessages] = useState<ConversationMessage[]>(initialMessages);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const isLocked = projectPhase === "active" || projectPhase === "completed";
  const minQuestions = 3;
  const maxQuestions = 10;
  const questionList = isInterview ? MC_FOLLOWUP_QUESTIONS : MC_INITIAL_QUESTIONS;
  const isIndexing = indexingStatus === "pending" || indexingStatus === "indexing";

  const parsedCodebaseIndex: CodebaseIndex | null = (() => {
    if (!codebaseIndex) return null;
    try {
      return JSON.parse(codebaseIndex);
    } catch {
      return null;
    }
  })();

  const {
    object: questionObject,
    submit: submitQuestion,
    isLoading: isQuestionLoading,
    stop: stopQuestion,
  } = useObject({
    api: "/api/chat/question",
    schema: questionSchema,
    onFinish: async ({ object }) => {
      if (object) {
        const content = JSON.stringify(object);
        await addMessageDb({ id: projectId, role: "assistant", content });
        setDisplayMessages((prev) => [...prev, { role: "assistant", content }]);
        setQuestionCount((prev) => prev + 1);
      }
    },
    onError: (error) => {
      console.error("Question generation error:", error);
    },
  });

  const {
    object: specObject,
    submit: submitSpec,
    isLoading: isSpecLoading,
  } = useObject({
    api: "/api/chat/spec",
    schema: specSchema,
    onFinish: async ({ object }) => {
      if (object) {
        const content = JSON.stringify(object);
        await addMessageDb({ id: projectId, role: "assistant", content });
        setDisplayMessages((prev) => [...prev, { role: "assistant", content }]);
        onSpecGenerated?.(content);
      }
    },
    onError: (error) => {
      console.error("Spec generation error:", error);
    },
  });

  const isLoading = isQuestionLoading || isSpecLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, questionObject]);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setDisplayMessages(initialMessages);
      const assistantMessages = initialMessages.filter((m) => m.role === "assistant");
      setQuestionCount(assistantMessages.length);
      if (assistantMessages.length > 0) {
        const parsedAnswers: AnswerRecord[] = [];
        for (let i = 0; i < initialMessages.length - 1; i++) {
          const msg = initialMessages[i];
          const nextMsg = initialMessages[i + 1];
          if (msg.role === "assistant" && nextMsg?.role === "user") {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.question) {
                parsedAnswers.push({ question: parsed.question, answer: nextMsg.content });
              }
            } catch {
              continue;
            }
          }
        }
        setAnswers(parsedAnswers);
      }
    }
  }, []);

  const askQuestion = useCallback(
    async (questionIndex: number, currentAnswers: AnswerRecord[]) => {
      if (questionIndex >= maxQuestions) return;

      const questionTemplate = questionList[questionIndex % questionList.length];

      submitQuestion({
        featureDescription: rawInput,
        questionTopic: questionTemplate,
        previousAnswers: currentAnswers,
        codebaseContext: parsedCodebaseIndex,
      });
    },
    [rawInput, submitQuestion, questionList, parsedCodebaseIndex]
  );

  const handleStartInterview = async () => {
    setHasStarted(true);
    await addMessageDb({ id: projectId, role: "user", content: rawInput });
    setDisplayMessages([{ role: "user", content: rawInput }]);
    askQuestion(0, []);
  };

  const handleAnswer = async (answer: string) => {
    const currentQuestion = questionObject?.question || "";
    const newAnswer = { question: currentQuestion, answer };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    await addMessageDb({ id: projectId, role: "user", content: answer });
    setDisplayMessages((prev) => [...prev, { role: "user", content: answer }]);

    const nextQuestionIndex = questionCount;
    if (nextQuestionIndex < maxQuestions) {
      askQuestion(nextQuestionIndex, updatedAnswers);
    }
  };

  const handleGenerateSpec = async () => {
    const specPrompt = "Generate implementation spec based on answers";
    await addMessageDb({ id: projectId, role: "user", content: specPrompt });
    setDisplayMessages((prev) => [...prev, { role: "user", content: specPrompt }]);

    submitSpec({
      featureDescription: rawInput,
      answers,
      codebaseContext: parsedCodebaseIndex,
    });
  };

  const handleClearChat = async () => {
    stopQuestion();
    await clearMessagesDb({ id: projectId });
    setDisplayMessages([]);
    setQuestionCount(0);
    setHasStarted(false);
    setAnswers([]);
  };

  const canGenerateSpec = questionCount >= minQuestions;
  const showQuestion = questionObject && !isSpecLoading && questionCount <= maxQuestions;

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
          Analyzing your codebase to provide context-aware questions. This usually takes 30-60 seconds.
        </p>
        <Spinner size="lg" />
      </div>
    );
  }

  if (indexingStatus === "error" && !hasStarted && !isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mb-4">
          <IconCode size={32} className="text-danger-600 dark:text-danger-400" />
        </div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">
          Indexing Failed
        </h3>
        <p className="text-sm text-default-500 mb-6 max-w-md">
          We couldn&apos;t analyze your codebase. You can still start the interview with generic questions.
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
          <IconPlayerPlay size={32} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-default-700 mb-2">
          Ready to Start Interview
        </h3>
        <p className="text-sm text-default-500 mb-6 max-w-md">
          Click the button below to start answering questions about your project. The AI
          will ask up to {maxQuestions} multiple choice questions to understand your
          requirements. You can generate a plan after {minQuestions} questions.
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
        {displayMessages.map((m, i) => {
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
              return <ChatMessage key={`msg-${i}`} role="assistant" content={m.content} />;
            }
          }
          return <ChatMessage key={`msg-${i}`} role="user" content={m.content} />;
        })}
        {isLoading && (
          <div className="flex gap-3 items-center">
            <Spinner size="sm" />
            <span className="text-sm text-default-500">
              {isSpecLoading ? "Generating plan..." : "Generating question..."}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-divider p-4 space-y-3">
        {showQuestion &&
          questionObject.question &&
          questionObject.options &&
          questionObject.options.every((o): o is string => typeof o === "string") && (
            <MultipleChoiceQuestion
              question={questionObject.question}
              options={questionObject.options.filter((o): o is string => typeof o === "string")}
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
              isDisabled={isLoading || isLocked || displayMessages.length === 0}
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
