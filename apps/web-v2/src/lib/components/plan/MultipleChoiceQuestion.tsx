"use client";

import { useState } from "react";
import { Button, Input, Card, CardContent } from "@conductor/ui";
import {
  IconCheck,
  IconPencil,
  IconArrowRight,
  IconLoader2,
} from "@tabler/icons-react";

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

  const canSubmit = isOther
    ? customAnswer.trim().length > 0
    : selected.length > 0;
  const optionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <p className="text-[15px] font-semibold leading-snug text-foreground">
        {question}
      </p>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {options.map((option, idx) => {
          const isSelected = selected === option.label;
          const letter = optionLetters[idx] ?? String(idx + 1);
          return (
            <Card
              key={`${option.label}-${idx}`}
              className={`cursor-pointer shadow-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                isSelected
                  ? "border-primary bg-accent ring-1 ring-primary"
                  : "border-transparent bg-secondary hover:bg-muted"
              } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
              onClick={() => !isLoading && setSelected(option.label)}
              role="button"
              tabIndex={isLoading ? -1 : 0}
              onKeyDown={(e) => {
                if (isLoading) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(option.label);
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
            isOther
              ? "border-primary bg-accent ring-1 ring-primary"
              : "border-transparent bg-secondary hover:bg-muted"
          } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
          onClick={() => !isLoading && setSelected("__other__")}
          role="button"
          tabIndex={isLoading ? -1 : 0}
          onKeyDown={(e) => {
            if (isLoading) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelected("__other__");
            }
          }}
        >
          <CardContent className="py-2 px-2.5">
            <div className="flex items-center gap-3">
              <span
                className={`
                  w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150
                  ${
                    isOther
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }
                `}
              >
                {isOther ? (
                  <IconCheck size={13} strokeWidth={3} />
                ) : (
                  <IconPencil size={13} />
                )}
              </span>
              <span
                className={`flex-1 text-sm ${isOther ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                Other...
              </span>
            </div>
            {isOther && (
              <div
                className="mt-2 ml-9 animate-in fade-in slide-in-from-top-1 duration-150"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Input
                  value={customAnswer}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={isLoading}
                  autoFocus
                  className="h-8 text-sm bg-background border-border shadow-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSubmit && !isLoading) {
                      handleSubmit();
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!canSubmit || isLoading}
      >
        {isLoading ? (
          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Submit
        {!isLoading && (
          <IconArrowRight size={15} strokeWidth={2.5} className="ml-1" />
        )}
      </Button>
    </div>
  );
}
