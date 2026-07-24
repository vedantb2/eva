"use client";

import { ModelSelect } from "@eva/ui";
import type { AIModel } from "@eva/backend";
import type { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";

type ModelFieldState = Pick<
  ReturnType<typeof useAvailableAiModels>,
  "model" | "options"
>;

export function ConfigModelField({
  label,
  description,
  disabled,
  state,
  onValueChange,
}: {
  label: string;
  description: string;
  disabled?: boolean;
  state: ModelFieldState;
  onValueChange: (model: AIModel) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <ModelSelect
        value={state.model}
        options={state.options}
        disabled={disabled}
        onValueChange={onValueChange}
        className="h-8 text-xs"
      />
      <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}
