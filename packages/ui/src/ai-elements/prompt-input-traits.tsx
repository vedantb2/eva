"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { usePromptInputController } from "./prompt-input";
import { cn } from "../utils/cn";

const ULTRATHINK_PROMPT_PREFIX = "Ultrathink:\n";

/** Same trigger chrome as SessionModeDropdown — plain button, no ghost Button. */
const traitsTriggerClassName =
  "flex h-7 items-center gap-1.5 rounded-md bg-muted px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:opacity-50";

export function isUltrathinkPrompt(text: string | null | undefined): boolean {
  return typeof text === "string" && /\bultrathink\b/i.test(text);
}

export function applyUltrathinkPrefix(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return ULTRATHINK_PROMPT_PREFIX;
  }
  if (trimmed.startsWith("Ultrathink:")) {
    return trimmed;
  }
  return `${ULTRATHINK_PROMPT_PREFIX}${trimmed}`;
}

export interface TraitsReasoningConfig {
  levels: ReadonlyArray<string>;
  default: string;
  ultrathink?: boolean;
}

export interface TraitsMenuConfig {
  reasoning?: TraitsReasoningConfig;
  thinkingToggle?: boolean;
  contextWindow1m?: boolean;
  contextWindowDefaultLabel?: string;
  fastMode?: boolean;
}

export interface TraitsMenuProps {
  config: TraitsMenuConfig;
  effortLevel: string | undefined;
  thinkingEnabled: boolean;
  use1mContext: boolean;
  fastMode: boolean;
  getLevelLabel: (level: string) => string;
  onEffortLevelChange: (level: string) => void;
  onThinkingEnabledChange: (enabled: boolean) => void;
  onUse1mContextChange: (use1m: boolean) => void;
  onFastModeChange: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function TraitsMenu({
  config,
  effortLevel,
  thinkingEnabled,
  use1mContext,
  fastMode,
  getLevelLabel,
  onEffortLevelChange,
  onThinkingEnabledChange,
  onUse1mContextChange,
  onFastModeChange,
  disabled,
  className,
}: TraitsMenuProps) {
  const hasAnyControls = Boolean(
    config.reasoning ||
    config.thinkingToggle ||
    config.contextWindow1m ||
    config.fastMode,
  );
  if (!hasAnyControls) {
    return null;
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      {config.reasoning ? (
        config.reasoning.ultrathink ? (
          <ReasoningDropdownWithUltrathink
            config={config.reasoning}
            effortLevel={effortLevel}
            getLevelLabel={getLevelLabel}
            onEffortLevelChange={onEffortLevelChange}
            disabled={disabled}
          />
        ) : (
          <SimpleTraitsDropdown
            label={getLevelLabel(effortLevel ?? config.reasoning.default)}
            value={effortLevel ?? config.reasoning.default}
            disabled={disabled}
            onValueChange={onEffortLevelChange}
            options={config.reasoning.levels.map((level) => ({
              value: level,
              label:
                getLevelLabel(level) +
                (level === config.reasoning?.default ? " (default)" : ""),
            }))}
          />
        )
      ) : null}
      {config.fastMode ? (
        <SimpleTraitsDropdown
          label={fastMode ? "Fast" : "Standard"}
          value={fastMode ? "fast" : "standard"}
          disabled={disabled}
          onValueChange={(value) => onFastModeChange(value === "fast")}
          options={[
            { value: "standard", label: "Standard (default)" },
            { value: "fast", label: "Fast" },
          ]}
        />
      ) : null}
      {config.contextWindow1m ? (
        <SimpleTraitsDropdown
          label={
            use1mContext ? "1M" : (config.contextWindowDefaultLabel ?? "200K")
          }
          value={use1mContext ? "1m" : "standard"}
          disabled={disabled}
          onValueChange={(value) => onUse1mContextChange(value === "1m")}
          options={[
            {
              value: "standard",
              label: `${config.contextWindowDefaultLabel ?? "200K"} (default)`,
            },
            { value: "1m", label: "1M" },
          ]}
        />
      ) : null}
      {config.thinkingToggle ? (
        <SimpleTraitsDropdown
          label={thinkingEnabled ? "Thinking" : "No thinking"}
          value={thinkingEnabled ? "on" : "off"}
          disabled={disabled}
          onValueChange={(value) => onThinkingEnabledChange(value === "on")}
          options={[
            { value: "on", label: "Thinking on" },
            { value: "off", label: "Thinking off" },
          ]}
        />
      ) : null}
    </div>
  );
}

function ReasoningDropdownWithUltrathink({
  config,
  effortLevel,
  getLevelLabel,
  onEffortLevelChange,
  disabled,
}: {
  config: TraitsReasoningConfig;
  effortLevel: string | undefined;
  getLevelLabel: (level: string) => string;
  onEffortLevelChange: (level: string) => void;
  disabled?: boolean;
}) {
  const { textInput } = usePromptInputController();
  const prompt = textInput.value;

  const ultrathinkPromptControlled = isUltrathinkPrompt(prompt);
  const ultrathinkInBodyText =
    ultrathinkPromptControlled &&
    isUltrathinkPrompt(prompt.replace(/^Ultrathink:\s*/i, ""));

  const resolvedEffort = effortLevel ?? config.default;
  const triggerLabel = ultrathinkPromptControlled
    ? "Ultrathink"
    : getLevelLabel(resolvedEffort);
  const radioValue = ultrathinkPromptControlled ? "ultrathink" : resolvedEffort;

  const handleEffortChange = (value: string) => {
    if (!value) return;

    if (value === "ultrathink") {
      const nextPrompt =
        prompt.trim().length === 0
          ? ULTRATHINK_PROMPT_PREFIX
          : applyUltrathinkPrefix(prompt);
      textInput.setInput(nextPrompt);
      return;
    }

    if (ultrathinkInBodyText) return;

    if (ultrathinkPromptControlled) {
      textInput.setInput(prompt.replace(/^Ultrathink:\s*/i, ""));
    }

    onEffortLevelChange(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={traitsTriggerClassName}
        >
          {triggerLabel}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {ultrathinkInBodyText ? (
          <p className="px-2 py-1.5 text-muted-foreground/80 text-xs">
            Your prompt contains &quot;ultrathink&quot; in the text. Remove it
            to change this option.
          </p>
        ) : null}
        <DropdownMenuRadioGroup
          value={radioValue}
          onValueChange={handleEffortChange}
        >
          {config.levels.map((level) => (
            <DropdownMenuRadioItem
              key={level}
              value={level}
              disabled={ultrathinkInBodyText}
            >
              {getLevelLabel(level)}
              {level === config.default ? " (default)" : ""}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem
            value="ultrathink"
            disabled={ultrathinkInBodyText}
          >
            Ultrathink
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SimpleTraitsDropdown({
  label,
  value,
  options,
  onValueChange,
  disabled,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={traitsTriggerClassName}
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
