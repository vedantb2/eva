"use client";

import { Select, SelectItem } from "@heroui/select";

export type ClaudeModel = "opus" | "sonnet" | "haiku";

const models: { key: ClaudeModel; label: string }[] = [
  { key: "opus", label: "Opus" },
  { key: "sonnet", label: "Sonnet" },
  { key: "haiku", label: "Haiku" },
];

interface ModelSelectorProps {
  value: ClaudeModel;
  onChange: (model: ClaudeModel) => void;
  isDisabled?: boolean;
}

export function ModelSelector({ value, onChange, isDisabled }: ModelSelectorProps) {
  return (
    <Select
      size="sm"
      aria-label="Model"
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0];
        if (selected) onChange(selected as ClaudeModel);
      }}
      className="w-28"
      classNames={{ trigger: "min-h-8 h-8" }}
      isDisabled={isDisabled}
    >
      {models.map((m) => (
        <SelectItem key={m.key}>{m.label}</SelectItem>
      ))}
    </Select>
  );
}
