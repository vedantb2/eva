"use client";

import { ModelSelect } from "@eva/ui";
import type { AIModel } from "@eva/backend";
import type { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { SettingsField } from "@/lib/components/settings/SettingsField";

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
    <SettingsField label={label} description={description}>
      <ModelSelect
        value={state.model}
        options={state.options}
        disabled={disabled}
        onValueChange={onValueChange}
        className="h-8 text-xs"
      />
    </SettingsField>
  );
}
