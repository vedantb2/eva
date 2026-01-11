"use client";

import { useState } from "react";
import { GenericId as Id } from "convex/values";

interface Question {
  _id: Id<"questions">;
  type: string;
  prompt: string;
  promptMarathi?: string;
  correctAnswer: string;
  options?: string[];
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  disabled: boolean;
}

export function QuestionCard({
  question,
  onAnswer,
  disabled,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    if (disabled || selected) return;
    setSelected(option);
    const isCorrect = option === question.correctAnswer;
    onAnswer(isCorrect);
  };

  const getPromptText = () => {
    if (question.type === "translate_to_english" && question.promptMarathi) {
      return question.promptMarathi;
    }
    return question.prompt;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
          {question.type === "translate_to_english"
            ? "Translate to English"
            : question.type === "translate_to_marathi"
            ? "Translate to Marathi"
            : "Choose the correct answer"}
        </p>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {getPromptText()}
        </h2>
      </div>

      <div className="grid gap-3">
        {question.options?.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === question.correctAnswer;
          const showCorrect = selected && isCorrect;
          const showIncorrect = isSelected && !isCorrect;

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={disabled || !!selected}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                showCorrect
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : showIncorrect
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : isSelected
                  ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-yellow-300 dark:hover:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
              } ${disabled || selected ? "cursor-default" : "cursor-pointer"}`}
            >
              <span
                className={`text-lg ${
                  showCorrect
                    ? "text-green-700 dark:text-green-300"
                    : showIncorrect
                    ? "text-red-700 dark:text-red-300"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
