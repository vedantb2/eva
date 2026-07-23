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
export function normalizeMode(mode: string): SessionMode {
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
    // Same pattern for composer mode (`sessions.lastMode`).
    mode?: SessionMode;
    onModeChange?: (mode: SessionMode) => void;
    /**
     * Sticky traits from Convex. Undefined fields fall back to localStorage
     * (migration / first paint). When `onTraitsPersist` is set, trait edits
     * write to Convex and skip localStorage.
     */
    traits?: StoredModelTraits;
    onTraitsPersist?: (partial: Partial<StoredModelTraits>) => void;
    // Same pattern for sticky provider account (`sessions.providerAccountId`).
    providerAccountId?: string | null;
    onProviderAccountChange?: (providerAccountId: string | null) => void;
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
  const mode = normalizeMode(overrides?.mode ?? settings.mode);
  const providerAccountId =
    overrides?.providerAccountId !== undefined
      ? overrides.providerAccountId
      : (settings.providerAccountId ?? null);

  const storedTraits: StoredModelTraits = {
    effortLevel: overrides?.traits?.effortLevel ?? settings.effortLevel,
    thinkingEnabled:
      overrides?.traits?.thinkingEnabled ?? settings.thinkingEnabled,
    use1mContext: overrides?.traits?.use1mContext ?? settings.use1mContext,
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

  const setMode = (nextMode: SessionMode) => {
    if (overrides?.onModeChange) {
      overrides.onModeChange(nextMode);
      return;
    }
    setSettings((prev) => ({ ...prev, mode: nextMode }));
  };

  const onTraitsChange = (partial: Partial<StoredModelTraits>) => {
    if (overrides?.onTraitsPersist) {
      overrides.onTraitsPersist(partial);
      return;
    }
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const setProviderAccountId = (next: string | null) => {
    if (overrides?.onProviderAccountChange) {
      overrides.onProviderAccountChange(next);
      return;
    }
    setSettings((prev) => ({ ...prev, providerAccountId: next }));
  };

  return {
    model,
    mode,
    storedTraits,
    displayTraits,
    executionTraits,
    onTraitsChange,
    providerAccountId,
    setModel,
    setMode,
    setProviderAccountId,
  };
}
