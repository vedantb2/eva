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
