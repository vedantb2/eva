"use client";

import { IconChevronDown } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useOptionalPromptInputController } from "./prompt-input";
import { cn } from "../utils/cn";

const ULTRATHINK_PROMPT_PREFIX = "Ultrathink:\n";

/** Same trigger chrome as SessionModeDropdown — plain button, no ghost Button. */
const traitsTriggerClassName =
  "flex h-7 max-w-56 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50";

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

/**
 * One dropdown for every model trait (reasoning, Fast, context, thinking).
 * Sections are only rendered when the active model supports them.
 *
 * Renders inside a composer or standalone (task Properties, quick task modal).
 * Ultrathink is prompt-driven, so it only appears when a PromptInputProvider
 * is in scope.
 */
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
  const controller = useOptionalPromptInputController();
  const prompt = controller?.textInput.value ?? "";

  const hasAnyControls = Boolean(
    config.reasoning ||
      config.thinkingToggle ||
      config.contextWindow1m ||
      config.fastMode,
  );
  if (!hasAnyControls) {
    return null;
  }

  // Ultrathink is written into the prompt, so it needs a composer to write to.
  const ultrathinkAvailable =
    Boolean(config.reasoning?.ultrathink) && controller !== null;
  const ultrathinkPromptControlled =
    ultrathinkAvailable && isUltrathinkPrompt(prompt);
  const ultrathinkInBodyText =
    ultrathinkPromptControlled &&
    isUltrathinkPrompt(prompt.replace(/^Ultrathink:\s*/i, ""));

  const resolvedEffort = effortLevel ?? config.reasoning?.default ?? "";
  const contextDefaultLabel = config.contextWindowDefaultLabel ?? "200K";

  const triggerLabels: string[] = [];
  if (config.reasoning) {
    triggerLabels.push(
      ultrathinkPromptControlled
        ? "Ultrathink"
        : getLevelLabel(resolvedEffort),
    );
  }
  if (config.fastMode) {
    triggerLabels.push(fastMode ? "Fast" : "Standard");
  }
  if (config.contextWindow1m) {
    triggerLabels.push(use1mContext ? "1M" : contextDefaultLabel);
  }
  if (config.thinkingToggle) {
    triggerLabels.push(thinkingEnabled ? "Thinking" : "No thinking");
  }

  const handleEffortChange = (value: string) => {
    if (!value || !config.reasoning) return;

    if (value === "ultrathink") {
      if (!controller) return;
      const nextPrompt =
        prompt.trim().length === 0
          ? ULTRATHINK_PROMPT_PREFIX
          : applyUltrathinkPrefix(prompt);
      controller.textInput.setInput(nextPrompt);
      return;
    }

    if (ultrathinkInBodyText) return;

    if (ultrathinkPromptControlled && controller) {
      controller.textInput.setInput(prompt.replace(/^Ultrathink:\s*/i, ""));
    }

    onEffortLevelChange(value);
  };

  const effortRadioValue = ultrathinkPromptControlled
    ? "ultrathink"
    : resolvedEffort;

  const showSpeed = Boolean(config.fastMode);
  const showContext = Boolean(config.contextWindow1m);
  const showThinking = Boolean(config.thinkingToggle);
  const showReasoning = Boolean(config.reasoning);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(traitsTriggerClassName, className)}
        >
          <span className="min-w-0 truncate">{triggerLabels.join(" · ")}</span>
          <IconChevronDown
            aria-hidden="true"
            className="size-3 shrink-0 opacity-60"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {showReasoning && config.reasoning ? (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Reasoning
            </DropdownMenuLabel>
            {ultrathinkInBodyText ? (
              <p className="px-2 pb-1.5 text-muted-foreground/80 text-xs">
                Your prompt contains &quot;ultrathink&quot; in the text. Remove
                it to change this option.
              </p>
            ) : null}
            <DropdownMenuRadioGroup
              value={effortRadioValue}
              onValueChange={handleEffortChange}
            >
              {config.reasoning.levels.map((level) => (
                <DropdownMenuRadioItem
                  key={level}
                  value={level}
                  disabled={ultrathinkInBodyText}
                >
                  {getLevelLabel(level)}
                  {level === config.reasoning?.default ? " (default)" : ""}
                </DropdownMenuRadioItem>
              ))}
              {ultrathinkAvailable ? (
                <DropdownMenuRadioItem
                  value="ultrathink"
                  disabled={ultrathinkInBodyText}
                >
                  Ultrathink
                </DropdownMenuRadioItem>
              ) : null}
            </DropdownMenuRadioGroup>
          </>
        ) : null}
        {showSpeed ? (
          <>
            {showReasoning ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Speed
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={fastMode ? "fast" : "standard"}
              onValueChange={(value) => onFastModeChange(value === "fast")}
            >
              <DropdownMenuRadioItem value="standard">
                Standard (default)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="fast">Fast</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        ) : null}
        {showContext ? (
          <>
            {showReasoning || showSpeed ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Context window
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={use1mContext ? "1m" : "standard"}
              onValueChange={(value) => onUse1mContextChange(value === "1m")}
            >
              <DropdownMenuRadioItem value="standard">
                {contextDefaultLabel} (default)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="1m">1M</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        ) : null}
        {showThinking ? (
          <>
            {showReasoning || showSpeed || showContext ? (
              <DropdownMenuSeparator />
            ) : null}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Thinking
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={thinkingEnabled ? "on" : "off"}
              onValueChange={(value) => onThinkingEnabledChange(value === "on")}
            >
              <DropdownMenuRadioItem value="on">
                Thinking on
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="off">
                Thinking off
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
