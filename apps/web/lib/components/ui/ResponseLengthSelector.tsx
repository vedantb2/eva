"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";

export type ResponseLength = "concise" | "default" | "detailed";

const options: { key: ResponseLength; label: string }[] = [
  { key: "concise", label: "Concise" },
  { key: "default", label: "Default" },
  { key: "detailed", label: "Detailed" },
];

interface ResponseLengthSelectorProps {
  value: ResponseLength;
  onChange: (length: ResponseLength) => void;
  isDisabled?: boolean;
}

export function ResponseLengthSelector({
  value,
  onChange,
  isDisabled,
}: ResponseLengthSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ResponseLength)}
      disabled={isDisabled}
    >
      <SelectTrigger className="w-28 min-h-8 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
