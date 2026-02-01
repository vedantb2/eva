"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { IconCheck, IconPencil, IconArrowRight } from "@tabler/icons-react";

interface OptionItem {
  label: string;
  description: string;
}

interface MultipleChoiceQuestionProps {
  question: string;
  options: OptionItem[];
  onAnswer: (answer: string) => void;
  isLoading?: boolean;
  questionNumber?: number;
}

export function MultipleChoiceQuestion({
  question,
  options,
  onAnswer,
  isLoading = false,
}: MultipleChoiceQuestionProps) {
  const [selected, setSelected] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const isOther = selected === "__other__";

  const handleSubmit = () => {
    if (isOther && customAnswer.trim()) {
      onAnswer(customAnswer.trim());
      setSelected("");
      setCustomAnswer("");
    } else if (selected && selected !== "__other__") {
      onAnswer(selected);
      setSelected("");
      setCustomAnswer("");
    }
  };

  const canSubmit = isOther ? customAnswer.trim().length > 0 : selected.length > 0;
  const optionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-[15px] font-semibold leading-snug text-neutral-800 dark:text-neutral-200">
        {question}
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {options.map((option, idx) => {
          const isSelected = selected === option.label;
          const letter = optionLetters[idx] ?? String(idx + 1);
          return (
            <Card
              key={`${option.label}-${idx}`}
              isPressable
              isDisabled={isLoading}
              shadow="none"
              onPress={() => setSelected(option.label)}
              classNames={{
                base: `transition-all duration-200 ${
                  isSelected
                    ? "border-primary/60 bg-primary-50/80 dark:bg-primary-900/15 ring-1 ring-primary/20"
                    : "border-transparent bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/70"
                }`,
              }}
            >
              <CardBody className="flex-row items-start gap-3 py-2.5 px-3">
                <span
                  className={`
                    w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5
                    text-[11px] font-bold tracking-wide transition-all duration-200
                    ${isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "bg-neutral-200/70 dark:bg-neutral-700/50 text-neutral-500 dark:text-neutral-400"
                    }
                  `}
                >
                  {isSelected ? <IconCheck size={13} strokeWidth={3} /> : letter}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm leading-snug font-medium ${isSelected ? "text-primary-700 dark:text-primary-300" : "text-neutral-700 dark:text-neutral-300"}`}>
                    {option.label}
                  </span>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </CardBody>
            </Card>
          );
        })}

        <Card
          isPressable
          isDisabled={isLoading}
          shadow="none"
          onPress={() => setSelected("__other__")}
          classNames={{
            base: `transition-all duration-200 ${
              isOther
                ? "border-primary/60 bg-primary-50/80 dark:bg-primary-900/15 ring-1 ring-primary/20"
                : "border-transparent bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/70"
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
                    : "bg-neutral-200/70 dark:bg-neutral-700/50 text-neutral-500 dark:text-neutral-400"
                  }
                `}
              >
                {isOther ? <IconCheck size={13} strokeWidth={3} /> : <IconPencil size={13} />}
              </span>
              <span className={`flex-1 text-sm ${isOther ? "text-primary-700 dark:text-primary-300 font-medium" : "text-neutral-500"}`}>
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
                    inputWrapper: "bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 shadow-none",
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
