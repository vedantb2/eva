import { TraitsMenu } from "@eva/ui";
import type {
  ModelComposerControlDescriptor,
  ReasoningLevel,
  StoredModelTraits,
} from "@eva/backend";

interface ComposerCapabilityControlsProps {
  controls: ReadonlyArray<ModelComposerControlDescriptor>;
  isExecuting: boolean;
  onChange: (partial: Partial<StoredModelTraits>) => void;
}

/** Renders provider-normalized controls without importing provider wire types. */
export function ComposerCapabilityControls({
  controls,
  isExecuting,
  onChange,
}: ComposerCapabilityControlsProps) {
  let reasoning: Extract<
    ModelComposerControlDescriptor,
    { id: "reasoningLevel" }
  > | null = null;
  let thinking: Extract<
    ModelComposerControlDescriptor,
    { kind: "boolean" }
  > | null = null;
  let context: Extract<
    ModelComposerControlDescriptor,
    { kind: "boolean" }
  > | null = null;
  let hasLockedControl = false;

  for (const control of controls) {
    if (isExecuting && !control.mutableDuringActiveTurn) {
      hasLockedControl = true;
    }
    switch (control.id) {
      case "reasoningLevel":
        reasoning = control;
        break;
      case "thinkingEnabled":
        thinking = control;
        break;
      case "use1mContext":
        context = control;
        break;
    }
  }

  if (reasoning === null && thinking === null && context === null) return null;

  return (
    <TraitsMenu
      config={{
        ...(reasoning
          ? {
              reasoning: {
                levels: reasoning.options.map((option) => option.value),
                default: reasoning.defaultValue,
                ultrathink: reasoning.promptUltrathink,
              },
            }
          : {}),
        ...(thinking ? { thinkingToggle: true } : {}),
        ...(context ? { contextWindow1m: true } : {}),
      }}
      effortLevel={reasoning?.currentValue}
      thinkingEnabled={thinking?.currentValue ?? true}
      use1mContext={context?.currentValue ?? false}
      getLevelLabel={(level) => {
        for (const option of reasoning?.options ?? []) {
          if (option.value === level) return option.label;
        }
        return level;
      }}
      onEffortLevelChange={(level) => {
        if (level === undefined) {
          onChange({ effortLevel: undefined });
          return;
        }
        for (const option of reasoning?.options ?? []) {
          const value: ReasoningLevel = option.value;
          if (value === level) {
            onChange({ effortLevel: value });
            return;
          }
        }
      }}
      onThinkingEnabledChange={(enabled) => {
        onChange({ thinkingEnabled: enabled ? undefined : false });
      }}
      onUse1mContextChange={(use1mContext) => {
        onChange({ use1mContext: use1mContext ? true : undefined });
      }}
      disabled={hasLockedControl}
    />
  );
}
