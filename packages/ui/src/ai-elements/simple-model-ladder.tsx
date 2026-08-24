"use client";

import { IconChevronRight } from "@tabler/icons-react";
import { cn } from "../utils/cn";
import type { ModelOption } from "./model-picker-types";

/**
 * Discrete capability slider for simple view. Ticks are the available ladder
 * models, cheapest on the left. Advanced is a sibling control, not a tick.
 */
export function SimpleModelLadder<TModel extends string>({
  value,
  steps,
  snappedId,
  disabled,
  onValueChange,
  onAdvanced,
}: {
  value: TModel;
  steps: ReadonlyArray<ModelOption<TModel>>;
  /** Ladder id to park the thumb on when `value` is off-ladder. */
  snappedId: TModel;
  disabled?: boolean;
  onValueChange: (model: TModel) => void;
  onAdvanced: () => void;
}) {
  const lastIndex = steps.length - 1;
  let index = 0;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step && (step.id === value || step.id === snappedId)) {
      index = i;
      if (step.id === value) break;
    }
  }
  const fillPct = lastIndex <= 0 ? 0 : (index / lastIndex) * 100;
  const selected = steps[index];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-5 items-center">
        <div className="pointer-events-none absolute inset-x-2 h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${fillPct}%` }}
          />
          {steps.map((step, tickIndex) => (
            <span
              key={step.id}
              className={cn(
                "absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
                tickIndex <= index ? "bg-primary-foreground/80" : "bg-background",
              )}
              style={{
                left: `${lastIndex <= 0 ? 0 : (tickIndex / lastIndex) * 100}%`,
              }}
              aria-hidden
            />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={index}
          disabled={disabled || lastIndex <= 0}
          aria-label="Model"
          aria-valuetext={selected?.label}
          onChange={(event) => {
            const next = Number.parseInt(event.currentTarget.value, 10);
            const step = Number.isInteger(next) ? steps[next] : undefined;
            if (!step) return;
            onValueChange(step.id);
          }}
          className={cn(
            "relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent",
            "[&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-border",
            "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-sm",
          )}
        />
      </div>
      <button
        type="button"
        onClick={onAdvanced}
        className="motion-press inline-flex items-center gap-0.5 self-start text-xs font-medium text-muted-foreground hover:text-foreground active:scale-[0.98]"
      >
        Advanced
        <IconChevronRight size={12} className="opacity-70" aria-hidden />
      </button>
    </div>
  );
}
