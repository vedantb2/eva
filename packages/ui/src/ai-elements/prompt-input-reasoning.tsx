"use client";

import { IconBrain } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../utils/cn";

export interface ReasoningLevelOption<TLevel extends string = string> {
  value: TLevel;
  label: string;
}

export interface ReasoningLeverProps<TLevel extends string = string> {
  value: TLevel;
  /** Ordered lowest → highest; the slider position maps to this array's index. */
  options: ReadonlyArray<ReasoningLevelOption<TLevel>>;
  onValueChange: (value: TLevel) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Toolbar lever for the session-wide reasoning effort. The trigger button shows
 * the current level; the popover holds a discrete slider (a native range input,
 * so it is keyboard-accessible with no extra dependency) whose stops map 1:1 to
 * `options`. Only rendered for providers that support a runtime lever — the
 * caller decides visibility (see `providerSupportsReasoning`).
 */
export function ReasoningLever<TLevel extends string>({
  value,
  options,
  onValueChange,
  disabled,
  className,
}: ReasoningLeverProps<TLevel>) {
  const currentIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const current = options[currentIndex] ?? options[0];
  const maxIndex = options.length - 1;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title="Reasoning effort"
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50",
            className,
          )}
        >
          <IconBrain size={14} />
          {current?.label ?? "Reasoning"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              Reasoning effort
            </span>
            <span className="text-xs text-muted-foreground">
              {current?.label}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxIndex}
            step={1}
            value={currentIndex}
            disabled={disabled}
            aria-label="Reasoning effort"
            onChange={(event) => {
              const next = options[Number(event.target.value)];
              if (next) onValueChange(next.value);
            }}
            className="w-full accent-primary"
          />
          <div className="flex justify-between">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onValueChange(option.value)}
                className={cn(
                  "text-[10px] transition-colors hover:text-foreground",
                  index === currentIndex
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Applies to every message in this chat. Higher levels let Eva think
            longer before responding.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
