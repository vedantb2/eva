"use client";

import { useState } from "react";
import { Button, Input, Card, CardContent, Badge } from "@conductor/ui";
import {
  IconCheck,
  IconPencil,
  IconArrowRight,
  IconArrowLeft,
  IconLoader2,
} from "@tabler/icons-react";

interface OptionItem {
  label: string;
  description: string;
}

interface QuestionItem {
  question: string;
  header: string;
  options: OptionItem[];
  multiSelect: boolean;
}

interface MultipleChoiceQuestionProps {
  question?: string;
  options?: OptionItem[];
  questions?: QuestionItem[];
  onAnswer: (answer: string) => void;
  isLoading?: boolean;
  questionNumber?: number;
}

export function MultipleChoiceQuestion({
  question,
  options,
  questions,
  onAnswer,
  isLoading = false,
}: MultipleChoiceQuestionProps) {
  const resolvedQuestions: QuestionItem[] = questions
    ? questions
    : question && options
      ? [{ question, header: "", options, multiSelect: false }]
      : [];

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>(
    {},
  );
  const [otherActive, setOtherActive] = useState<Record<number, boolean>>({});

  const optionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const totalSteps = resolvedQuestions.length;
  const isMultiStep = totalSteps > 1;
  const q = resolvedQuestions[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const toggleOption = (label: string, multiSelect: boolean) => {
    const idx = currentStep;
    setAnswers((prev) => {
      const current = prev[idx] ?? [];
      if (multiSelect) {
        const exists = current.includes(label);
        return {
          ...prev,
          [idx]: exists
            ? current.filter((l) => l !== label)
            : [...current, label],
        };
      }
      return { ...prev, [idx]: [label] };
    });
    setOtherActive((prev) => ({ ...prev, [idx]: false }));
  };

  const toggleOther = () => {
    const idx = currentStep;
    setOtherActive((prev) => ({ ...prev, [idx]: true }));
    setAnswers((prev) => ({ ...prev, [idx]: [] }));
  };

  const currentHasAnswer = otherActive[currentStep]
    ? (customAnswers[currentStep] ?? "").trim().length > 0
    : (answers[currentStep] ?? []).length > 0;

  const formatAnswer = () => {
    return resolvedQuestions
      .map((rq, idx) => {
        const answer = otherActive[idx]
          ? (customAnswers[idx] ?? "").trim()
          : (answers[idx] ?? []).join(", ");
        return `Q: ${rq.question}\nA: ${answer}`;
      })
      .join("\n\n");
  };

  const handleNext = () => {
    if (!currentHasAnswer || isLoading) return;
    if (isLastStep) {
      onAnswer(formatAnswer());
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!q) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold leading-snug text-foreground">
          {q.question}
        </p>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {q.header && (
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {q.header}
            </Badge>
          )}
          {isMultiStep && (
            <span className="text-[11px] text-muted-foreground font-medium">
              {currentStep + 1}/{totalSteps}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {q.options.map((option, optIdx) => {
          const isSelected = (answers[currentStep] ?? []).includes(
            option.label,
          );
          const letter = optionLetters[optIdx] ?? String(optIdx + 1);
          return (
            <Card
              key={`${option.label}-${optIdx}`}
              className={`cursor-pointer shadow-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                isSelected
                  ? "border-primary bg-accent ring-1 ring-primary"
                  : "border-transparent bg-secondary hover:bg-muted"
              } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
              onClick={() =>
                !isLoading && toggleOption(option.label, q.multiSelect)
              }
              role="button"
              tabIndex={isLoading ? -1 : 0}
              onKeyDown={(e) => {
                if (isLoading) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleOption(option.label, q.multiSelect);
                }
              }}
            >
              <CardContent className="flex flex-row items-start gap-3 py-2 px-2.5">
                <span
                  className={`
                    w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5
                    text-[11px] font-bold tracking-wide transition-all duration-150
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }
                  `}
                >
                  {isSelected ? (
                    <IconCheck size={13} strokeWidth={3} />
                  ) : (
                    letter
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm leading-snug font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {option.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card
          className={`cursor-pointer shadow-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
            otherActive[currentStep]
              ? "border-primary bg-accent ring-1 ring-primary"
              : "border-transparent bg-secondary hover:bg-muted"
          } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
          onClick={() => !isLoading && toggleOther()}
          role="button"
          tabIndex={isLoading ? -1 : 0}
          onKeyDown={(e) => {
            if (isLoading) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleOther();
            }
          }}
        >
          <CardContent className="py-2 px-2.5">
            <div className="flex items-center gap-3">
              <span
                className={`
                  w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150
                  ${
                    otherActive[currentStep]
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }
                `}
              >
                {otherActive[currentStep] ? (
                  <IconCheck size={13} strokeWidth={3} />
                ) : (
                  <IconPencil size={13} />
                )}
              </span>
              <span
                className={`flex-1 text-sm ${otherActive[currentStep] ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                Other...
              </span>
            </div>
            {otherActive[currentStep] && (
              <div
                className="mt-2 ml-9 animate-in fade-in slide-in-from-top-1 duration-150"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Input
                  value={customAnswers[currentStep] ?? ""}
                  onChange={(e) =>
                    setCustomAnswers((prev) => ({
                      ...prev,
                      [currentStep]: e.target.value,
                    }))
                  }
                  placeholder="Type your answer..."
                  disabled={isLoading}
                  autoFocus
                  className="h-8 text-sm bg-background border-border shadow-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && currentHasAnswer && !isLoading) {
                      handleNext();
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {isMultiStep && currentStep > 0 && (
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleBack}
            disabled={isLoading}
          >
            <IconArrowLeft size={15} strokeWidth={2.5} className="mr-1" />
            Back
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleNext}
          disabled={!currentHasAnswer || isLoading}
        >
          {isLoading ? (
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isLastStep ? "Submit" : "Next"}
          {!isLoading && (
            <IconArrowRight size={15} strokeWidth={2.5} className="ml-1" />
          )}
        </Button>
      </div>
    </div>
  );
}
