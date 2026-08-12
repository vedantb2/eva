"use client";

import { ModelSelect } from "@eva/ui";
import type { AIModel, StoredModelTraits } from "@eva/backend";
import type { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { ModelTraitsMenu } from "@/lib/components/ModelTraitsMenu";
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
  traits,
  onValueChange,
  onTraitsChange,
}: {
  label: string;
  description: string;
  disabled?: boolean;
  state: ModelFieldState;
  traits: StoredModelTraits;
  onValueChange: (model: AIModel) => void;
  onTraitsChange: (partial: StoredModelTraits) => void;
}) {
  return (
    <SettingsField label={label} description={description}>
      <div className="flex flex-wrap items-center gap-2">
        <ModelSelect
          value={state.model}
          options={state.options}
          disabled={disabled}
          onValueChange={onValueChange}
          className="h-9"
        />
        <ModelTraitsMenu
          model={state.model}
          traits={traits}
          onChange={onTraitsChange}
          disabled={disabled}
        />
      </div>
    </SettingsField>
  );
}
