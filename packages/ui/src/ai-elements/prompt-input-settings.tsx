"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { IconBrain, IconTextResize, IconDots } from "@tabler/icons-react";
import { cn } from "../utils/cn";

export type ClaudeModel = "opus" | "sonnet" | "haiku";
export type ResponseLength = "concise" | "default" | "detailed";

const MODELS: { key: ClaudeModel; label: string }[] = [
  { key: "opus", label: "Opus" },
  { key: "sonnet", label: "Sonnet" },
  { key: "haiku", label: "Haiku" },
];

const RESPONSE_LENGTHS: { key: ResponseLength; label: string }[] = [
  { key: "concise", label: "Concise" },
  { key: "default", label: "Default" },
  { key: "detailed", label: "Detailed" },
];

function isClaudeModel(v: string): v is ClaudeModel {
  return MODELS.some((m) => m.key === v);
}

function isResponseLength(v: string): v is ResponseLength {
  return RESPONSE_LENGTHS.some((o) => o.key === v);
}

export interface PromptInputSettingsProps {
  model: ClaudeModel;
  onModelChange: (model: ClaudeModel) => void;
  responseLength?: ResponseLength;
  onResponseLengthChange?: (length: ResponseLength) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function PromptInputSettings({
  model,
  onModelChange,
  responseLength,
  onResponseLengthChange,
  disabled,
  icon,
  className,
}: PromptInputSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50",
            className,
          )}
          disabled={disabled}
        >
          {icon ?? <IconDots size={16} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconBrain size={14} />
            Model
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={model}
              onValueChange={(v) => {
                if (isClaudeModel(v)) onModelChange(v);
              }}
            >
              {MODELS.map((m) => (
                <DropdownMenuRadioItem key={m.key} value={m.key}>
                  {m.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {onResponseLengthChange && responseLength !== undefined && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <IconTextResize size={14} />
              Response length
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={responseLength}
                onValueChange={(v) => {
                  if (isResponseLength(v)) onResponseLengthChange(v);
                }}
              >
                {RESPONSE_LENGTHS.map((o) => (
                  <DropdownMenuRadioItem key={o.key} value={o.key}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface ModelSelectProps {
  value: ClaudeModel;
  onValueChange: (model: ClaudeModel) => void;
  disabled?: boolean;
  className?: string;
}

export function ModelSelect({
  value,
  onValueChange,
  disabled,
  className,
}: ModelSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (isClaudeModel(v)) onValueChange(v);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-7 w-auto gap-1.5 border-none bg-transparent px-2 text-xs font-medium text-muted-foreground shadow-none",
          "hover:bg-accent hover:text-foreground",
          className,
        )}
      >
        <IconBrain size={14} className="shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MODELS.map((m) => (
          <SelectItem key={m.key} value={m.key}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface ResponseLengthSelectProps {
  value: ResponseLength;
  onValueChange: (length: ResponseLength) => void;
  disabled?: boolean;
  className?: string;
}

export function ResponseLengthSelect({
  value,
  onValueChange,
  disabled,
  className,
}: ResponseLengthSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (isResponseLength(v)) onValueChange(v);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-7 w-auto gap-1.5 border-none bg-transparent px-2 text-xs font-medium text-muted-foreground shadow-none",
          "hover:bg-accent hover:text-foreground",
          className,
        )}
      >
        <IconTextResize size={14} className="shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RESPONSE_LENGTHS.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
