"use client";

import {
  getModelTraits,
  getReasoningLevelLabel,
  modelHasTraits,
  resolveTraitsForDisplay,
  type AIModel,
  type StoredModelTraits,
} from "@eva/backend";
import { ModelSelect, type ModelSelectProps } from "@eva/ui";
import { ModelTraitsMenu } from "@/lib/components/ModelTraitsMenu";

function triggerTraitUi(
  model: AIModel,
  traits: StoredModelTraits,
): { suffix: string | undefined; showFastIcon: boolean } {
  const config = getModelTraits(model);
  const display = resolveTraitsForDisplay(model, traits);
  let suffix: string | undefined;
  if (config.reasoning) {
    suffix = getReasoningLevelLabel(
      display.effortLevel ?? config.reasoning.default,
    );
  } else if (config.contextWindow1m && display.use1mContext) {
    suffix = "1M";
  } else if (config.thinkingToggle && !display.thinkingEnabled) {
    suffix = "No thinking";
  }
  return {
    suffix,
    showFastIcon: Boolean(config.fastMode && display.fastMode),
  };
}

type ModelSelectWithTraitsProps = Omit<
  ModelSelectProps<AIModel>,
  "header" | "triggerSuffix" | "showFastIcon"
> & {
  traits?: StoredModelTraits;
  onTraitsChange?: (partial: StoredModelTraits) => void;
};

/**
 * One trigger for model + traits. Opening the picker lists models; capable
 * models also show trait pills above the list so switching either is one menu.
 */
export function ModelSelectWithTraits({
  value,
  traits,
  onTraitsChange,
  disabled,
  ...selectProps
}: ModelSelectWithTraitsProps) {
  const traitsUi =
    onTraitsChange !== undefined &&
    traits !== undefined &&
    modelHasTraits(value)
      ? {
          ...triggerTraitUi(value, traits),
          header: (
            <ModelTraitsMenu
              model={value}
              traits={traits}
              onChange={onTraitsChange}
              disabled={disabled}
            />
          ),
        }
      : undefined;

  return (
    <ModelSelect
      {...selectProps}
      value={value}
      disabled={disabled}
      triggerSuffix={traitsUi?.suffix}
      showFastIcon={traitsUi?.showFastIcon}
      header={traitsUi?.header}
    />
  );
}
