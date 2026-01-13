"use client";

import { useState } from "react";
import { RadioGroup, Radio } from "@heroui/radio";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Progress } from "@heroui/progress";
import { IconSend } from "@tabler/icons-react";

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
    <div className="p-4 bg-default-100 rounded-xl space-y-4">
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
      <RadioGroup value={selected} onValueChange={setSelected} isDisabled={isLoading}>
        {options.map((option, idx) => (
          <Radio key={`${option}-${idx}`} value={option}>
            {option}
          </Radio>
        ))}
        <Radio value="other">Other (custom answer)</Radio>
      </RadioGroup>
      {isOther && (
        <Input
          value={customAnswer}
          onChange={(e) => setCustomAnswer(e.target.value)}
          placeholder="Enter your custom answer..."
          isDisabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit && !isLoading) {
              handleSubmit();
            }
          }}
        />
      )}
      <Button
        color="primary"
        size="sm"
        onPress={handleSubmit}
        isDisabled={!canSubmit || isLoading}
        isLoading={isLoading}
        endContent={<IconSend size={16} />}
      >
        Submit Answer
      </Button>
    </div>
  );
}
