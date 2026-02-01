"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Progress } from "@heroui/progress";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { IconCheck, IconPencil, IconArrowRight } from "@tabler/icons-react";

interface MultipleChoiceQuestionProps {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  isLoading?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

export function MultipleChoiceQuestion({
  question,
  options,
  onAnswer,
  isLoading = false,
  questionNumber,
  totalQuestions,
}: MultipleChoiceQuestionProps) {
  const [selected, setSelected] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const isOther = selected === "other";

  const handleSubmit = () => {
    if (isOther && customAnswer.trim()) {
      onAnswer(customAnswer.trim());
      setSelected("");
      setCustomAnswer("");
    } else if (selected && selected !== "other") {
      onAnswer(selected);
      setSelected("");
      setCustomAnswer("");
    }
  };

  const canSubmit = isOther ? customAnswer.trim().length > 0 : selected.length > 0;
  const showProgress = questionNumber !== undefined && totalQuestions !== undefined;
  const progressValue = showProgress ? (questionNumber / totalQuestions) * 100 : 0;
  const optionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {showProgress && (
        <div className="flex items-center gap-3">
          <Chip size="sm" variant="flat" classNames={{ content: "text-[11px] font-medium tracking-widest uppercase px-0" }}>
            {questionNumber}/{totalQuestions}
          </Chip>
          <Progress
            value={progressValue}
            size="sm"
            classNames={{
              track: "h-1",
              indicator: "bg-gradient-to-r from-primary-400 to-primary-600",
            }}
          />
          <span className="text-[11px] font-medium tabular-nums text-default-400">
            {Math.round(progressValue)}%
          </span>
        </div>
      )}

      <p className="text-[15px] font-semibold leading-snug text-default-800 dark:text-default-200">
        {question}
      </p>

      <div className="flex flex-col gap-1.5">
        {options.map((option, idx) => {
          const isSelected = selected === option;
          const letter = optionLetters[idx] ?? String(idx + 1);
          return (
            <Card
              key={`${option}-${idx}`}
              isPressable
              isDisabled={isLoading}
              shadow="none"
              onPress={() => setSelected(option)}
              classNames={{
                base: `transition-all duration-200 ${
                  isSelected
                    ? "border-primary/60 bg-primary-50/80 dark:bg-primary-900/15 ring-1 ring-primary/20"
                    : "border-transparent bg-default-50 dark:bg-default-800/40 hover:bg-default-100 dark:hover:bg-default-800/70"
                }`,
              }}
            >
              <CardBody className="flex-row items-center gap-3 py-2.5 px-3">
                <span
                  className={`
                    w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0
                    text-[11px] font-bold tracking-wide transition-all duration-200
                    ${isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "bg-default-200/70 dark:bg-default-700/50 text-default-500 dark:text-default-400"
                    }
                  `}
                >
                  {isSelected ? <IconCheck size={13} strokeWidth={3} /> : letter}
                </span>
                <span className={`flex-1 text-sm leading-snug ${isSelected ? "text-primary-700 dark:text-primary-300 font-medium" : "text-default-700 dark:text-default-300"}`}>
                  {option}
                </span>
              </CardBody>
            </Card>
          );
        })}

        <Card
          isPressable
          isDisabled={isLoading}
          shadow="none"
          onPress={() => setSelected("other")}
          classNames={{
            base: `transition-all duration-200 ${
              isOther
                ? "border-primary/60 bg-primary-50/80 dark:bg-primary-900/15 ring-1 ring-primary/20"
                : "border-transparent bg-default-50 dark:bg-default-800/40 hover:bg-default-100 dark:hover:bg-default-800/70"
            }`,
          }}
        >
          <CardBody className="py-2.5 px-3">
            <div className="flex items-center gap-3">
              <span
                className={`
                  w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200
                  ${isOther
                    ? "bg-primary text-white shadow-sm"
                    : "bg-default-200/70 dark:bg-default-700/50 text-default-500 dark:text-default-400"
                  }
                `}
              >
                {isOther ? <IconCheck size={13} strokeWidth={3} /> : <IconPencil size={13} />}
              </span>
              <span className={`flex-1 text-sm ${isOther ? "text-primary-700 dark:text-primary-300 font-medium" : "text-default-500"}`}>
                Other...
              </span>
            </div>
            {isOther && (
              <div className="mt-2 ml-9 animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
                <Input
                  size="sm"
                  value={customAnswer}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  isDisabled={isLoading}
                  autoFocus
                  classNames={{
                    inputWrapper: "bg-white dark:bg-default-900/60 border border-default-200 dark:border-default-700 shadow-none",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSubmit && !isLoading) {
                      handleSubmit();
                    }
                  }}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Button
        color="primary"
        className="w-full"
        radius="md"
        onPress={handleSubmit}
        isDisabled={!canSubmit || isLoading}
        isLoading={isLoading}
        endContent={!isLoading && <IconArrowRight size={15} strokeWidth={2.5} />}
      >
        Submit
      </Button>
    </div>
  );
}
