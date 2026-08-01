import { useMemo } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { usePromptInputController } from "./prompt-input";
import { cn } from "../utils/cn";

const ULTRATHINK_PROMPT_PREFIX = "Ultrathink:\n";

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
}

export interface TraitsMenuProps {
  config: TraitsMenuConfig;
  effortLevel: string | undefined;
  thinkingEnabled: boolean;
  use1mContext: boolean;
  getLevelLabel: (level: string) => string;
  onEffortLevelChange: (level: string | undefined) => void;
  onThinkingEnabledChange: (enabled: boolean) => void;
  onUse1mContextChange: (use1m: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function TraitsMenu({
  config,
  effortLevel,
  thinkingEnabled,
  use1mContext,
  getLevelLabel,
  onEffortLevelChange,
  onThinkingEnabledChange,
  onUse1mContextChange,
  disabled,
  className,
}: TraitsMenuProps) {
  const { textInput } = usePromptInputController();
  const prompt = textInput.value;

  const ultrathinkPromptControlled =
    Boolean(config.reasoning?.ultrathink) && isUltrathinkPrompt(prompt);
  const ultrathinkInBodyText =
    ultrathinkPromptControlled &&
    isUltrathinkPrompt(prompt.replace(/^Ultrathink:\s*/i, ""));

  const resolvedEffort = effortLevel ?? config.reasoning?.default ?? "";

  const triggerLabels = useMemo(() => {
    const labels: string[] = [];
    if (config.reasoning) {
      labels.push(
        ultrathinkPromptControlled
          ? "Ultrathink"
          : getLevelLabel(resolvedEffort),
      );
    }
    if (config.thinkingToggle) {
      labels.push(`Thinking ${thinkingEnabled ? "On" : "Off"}`);
    }
    if (config.contextWindow1m) {
      labels.push(use1mContext ? "1M context" : "200K context");
    }
    return labels;
  }, [
    config,
    getLevelLabel,
    resolvedEffort,
    thinkingEnabled,
    ultrathinkPromptControlled,
    use1mContext,
  ]);

  const hasAnyControls = Boolean(
    config.reasoning || config.thinkingToggle || config.contextWindow1m,
  );
  if (!hasAnyControls) {
    return null;
  }

  const handleEffortChange = (value: string) => {
    if (!value || !config.reasoning) return;

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

    if (value === config.reasoning.default) {
      onEffortLevelChange(undefined);
      return;
    }
    onEffortLevelChange(value);
  };

  const effortRadioValue = ultrathinkPromptControlled
    ? "ultrathink"
    : resolvedEffort;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          className={cn(
            "shrink-0 whitespace-nowrap px-2 text-subtle-foreground hover:text-foreground/80 sm:px-3",
            className,
          )}
        >
          <span>{triggerLabels.join(" · ")}</span>
          <IconChevronDown aria-hidden="true" className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {config.reasoning ? (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Reasoning
            </DropdownMenuLabel>
            {ultrathinkInBodyText ? (
              <p className="px-2 pb-1.5 text-muted-foreground text-xs">
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
              {config.reasoning.ultrathink ? (
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
        {config.contextWindow1m ? (
          <>
            {config.reasoning ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Context window
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={use1mContext ? "1m" : "200k"}
              onValueChange={(value) => onUse1mContextChange(value === "1m")}
            >
              <DropdownMenuRadioItem value="200k">
                200K (default)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="1m">1M</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        ) : null}
        {config.thinkingToggle ? (
          <>
            {config.reasoning || config.contextWindow1m ? (
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
                On (default)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="off">Off</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
