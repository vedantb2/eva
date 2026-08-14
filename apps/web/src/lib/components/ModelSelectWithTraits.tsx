"use client";

import {
  getModelTraits,
  getReasoningLevelLabel,
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
  const parts: string[] = [];
  if (config.reasoning) {
    parts.push(
      getReasoningLevelLabel(display.effortLevel ?? config.reasoning.default),
    );
  }
  if (config.contextWindow1m && display.use1mContext) {
    parts.push("1M");
  }
  if (config.thinkingToggle && !display.thinkingEnabled) {
    parts.push("No thinking");
  }
  return {
    suffix: parts.length > 0 ? parts.join(" · ") : undefined,
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
    onTraitsChange !== undefined && traits !== undefined
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
