"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";

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
      value={value}
      onValueChange={(v) => onChange(v as ClaudeModel)}
      disabled={isDisabled}
    >
      <SelectTrigger className="w-28 min-h-8 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {models.map((m) => (
          <SelectItem key={m.key} value={m.key}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
