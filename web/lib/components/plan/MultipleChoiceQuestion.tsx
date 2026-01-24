"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Progress } from "@heroui/progress";
import { IconSend, IconCheck, IconPencil } from "@tabler/icons-react";

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

  return (
    <div className="space-y-3">
      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-default-500">
            <span>Question {questionNumber} of {totalQuestions}</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <Progress
            value={progressValue}
            size="sm"
            color="primary"
            classNames={{ indicator: "bg-gradient-to-r from-primary-400 to-primary-600" }}
          />
        </div>
      )}
      <p className="font-medium text-default-800">{question}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option, idx) => {
          const isSelected = selected === option;
          return (
            <button
              key={`${option}-${idx}`}
              type="button"
              disabled={isLoading}
              onClick={() => setSelected(option)}
              className={`
                text-left px-3 py-3 rounded-lg border-2 transition-all duration-150
                flex items-start gap-2 text-sm
                ${isSelected
                  ? "border-primary bg-primary-50 dark:bg-primary-900/20"
                  : "border-default-200 dark:border-default-700 hover:border-default-400 dark:hover:border-default-500 hover:bg-default-50 dark:hover:bg-default-800/50"
                }
                ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "border-primary bg-primary" : "border-default-300 dark:border-default-600"}`}>
                {isSelected && <IconCheck size={10} className="text-white" />}
              </div>
              <span className={isSelected ? "text-primary-700 dark:text-primary-300" : "text-default-700 dark:text-default-300"}>
                {option}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setSelected("other")}
          className={`
            text-left px-3 py-3 rounded-lg border-2 transition-all duration-150 text-sm
            ${options.length % 2 === 0 ? "col-span-2" : ""}
            ${isOther
              ? "border-primary bg-primary-50 dark:bg-primary-900/20"
              : "border-default-200 dark:border-default-700 hover:border-default-400 dark:hover:border-default-500 hover:bg-default-50 dark:hover:bg-default-800/50"
            }
            ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isOther ? "border-primary bg-primary" : "border-default-300 dark:border-default-600"}`}>
              {isOther && <IconCheck size={10} className="text-white" />}
            </div>
            <IconPencil size={14} className={isOther ? "text-primary" : "text-default-400"} />
            <span className={isOther ? "text-primary-700 dark:text-primary-300" : "text-default-500"}>
              Other...
            </span>
          </div>
          {isOther && (
            <div className="mt-2 pl-6" onClick={(e) => e.stopPropagation()}>
              <Input
                size="sm"
                value={customAnswer}
                onChange={(e) => setCustomAnswer(e.target.value)}
                placeholder="Type your answer..."
                isDisabled={isLoading}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit && !isLoading) {
                    handleSubmit();
                  }
                }}
              />
            </div>
          )}
        </button>
      </div>
      <Button
        color="primary"
        className="w-full"
        onPress={handleSubmit}
        isDisabled={!canSubmit || isLoading}
        isLoading={isLoading}
        endContent={!isLoading && <IconSend size={16} />}
      >
        Submit Answer
      </Button>
    </div>
  );
}
