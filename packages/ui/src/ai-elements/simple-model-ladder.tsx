"use client";

import { useState } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import { cn } from "../utils/cn";
import type { ModelOption } from "./model-picker-types";

/**
 * Discrete capability slider for simple view. Ticks are the available ladder
 * models, cheapest on the left. Resting chrome is Advanced; a held drag swaps
 * that for Faster / Smarter so the thumb is the only control.
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
  const [dragging, setDragging] = useState(false);
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

  const applyIndex = (raw: string) => {
    const next = Number.parseInt(raw, 10);
    const step = Number.isInteger(next) ? steps[next] : undefined;
    if (!step) return;
    onValueChange(step.id);
  };

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
                "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                tickIndex <= index
                  ? "bg-primary-foreground/80"
                  : "bg-muted-foreground/35",
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
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onChange={(event) => applyIndex(event.currentTarget.value)}
          onInput={(event) => applyIndex(event.currentTarget.value)}
          className={cn(
            "relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent",
            "[&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-border",
            "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:shadow-sm",
          )}
        />
      </div>
      <div className="flex min-h-5 items-center">
        {dragging ? (
          <div className="flex w-full justify-between text-[11px] font-medium text-muted-foreground">
            <span>Faster</span>
            <span>Smarter</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdvanced}
            className="motion-press inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground active:scale-[0.98]"
          >
            Advanced
            <IconChevronRight size={12} className="opacity-70" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
