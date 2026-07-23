"use client";

import { useLocalStorage } from "usehooks-ts";
import {
  DEFAULT_AI_MODEL,
  buildTraitsExecutionPayload,
  normalizeAIModel,
  resolveTraitsForDisplay,
  type AIModel,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@conductor/backend";

const SESSION_MODES = ["edit", "plan"] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

/** Migrates old stored mode values ("ask"/"execute") to "edit". */
function normalizeMode(mode: string): SessionMode {
  if (mode === "ask" || mode === "execute") return "edit";
  if (mode === "plan") return "plan";
  return "edit";
}

interface StoredSettings {
  model: AIModel;
  mode: SessionMode;
  effortLevel?: ReasoningLevel;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
  providerAccountId: string | null;
}

const DEFAULT_SETTINGS: StoredSettings = {
  model: DEFAULT_AI_MODEL,
  mode: "edit",
  providerAccountId: null,
};

function storageKey(sessionId: string) {
  return `conductor:session-settings:${sessionId}`;
}

export function useSessionSettings(
  sessionId: string,
  overrides?: {
    defaultModel?: string | null;
    // When provided, the model becomes a controlled value owned by the caller
    // (Convex `sessions.lastModel` for an existing session) instead of being
    // persisted in localStorage. Trait resolution still runs against this
    // model. New-session composers omit these and keep the local-storage model.
    model?: AIModel;
    onModelChange?: (model: AIModel) => void;
    // Same pattern for reasoning effort (`sessions.lastReasoningLevel`).
    effortLevel?: ReasoningLevel;
    onEffortLevelChange?: (effortLevel: ReasoningLevel) => void;
  },
) {
  const defaults: StoredSettings = overrides?.defaultModel
    ? { ...DEFAULT_SETTINGS, model: normalizeAIModel(overrides.defaultModel) }
    : DEFAULT_SETTINGS;

  const [settings, setSettings] = useLocalStorage(
    storageKey(sessionId),
    defaults,
  );

  const model = overrides?.model ?? normalizeAIModel(settings.model);

  const storedTraits: StoredModelTraits = {
    effortLevel: overrides?.effortLevel ?? settings.effortLevel,
    thinkingEnabled: settings.thinkingEnabled,
    use1mContext: settings.use1mContext,
  };

  const displayTraits = resolveTraitsForDisplay(model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(model, storedTraits);

  const setModel = (nextModel: AIModel) => {
    const normalized = normalizeAIModel(nextModel);
    if (overrides?.onModelChange) {
      overrides.onModelChange(normalized);
      return;
    }
    setSettings((prev) => ({ ...prev, model: normalized }));
  };

  const setMode = (mode: SessionMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  };

  const onTraitsChange = (partial: Partial<StoredModelTraits>) => {
    if (
      partial.effortLevel !== undefined &&
      overrides?.onEffortLevelChange !== undefined
    ) {
      overrides.onEffortLevelChange(partial.effortLevel);
    }
    setSettings((prev) => ({
      ...prev,
      ...(partial.thinkingEnabled !== undefined
        ? { thinkingEnabled: partial.thinkingEnabled }
        : {}),
      ...(partial.use1mContext !== undefined
        ? { use1mContext: partial.use1mContext }
        : {}),
      // When effort is Convex-backed, skip writing it to localStorage.
      ...(partial.effortLevel !== undefined &&
      overrides?.onEffortLevelChange === undefined
        ? { effortLevel: partial.effortLevel }
        : {}),
    }));
  };

  const setProviderAccountId = (providerAccountId: string | null) => {
    setSettings((prev) => ({ ...prev, providerAccountId }));
  };

  return {
    model,
    mode: normalizeMode(settings.mode),
    storedTraits,
    displayTraits,
    executionTraits,
    onTraitsChange,
    providerAccountId: settings.providerAccountId ?? null,
    setModel,
    setMode,
    setProviderAccountId,
  };
}
