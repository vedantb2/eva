"use client";

import {
  DEFAULT_AI_MODEL,
  buildTraitsExecutionPayload,
  normalizeAIModel,
  resolveTraitsForDisplay,
  type AIModel,
  type StoredModelTraits,
} from "@eva/backend";

const SESSION_MODES = ["edit", "plan"] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

/** Migrates old stored mode values ("ask"/"execute") to "edit". */
export function normalizeMode(mode: string): SessionMode {
  if (mode === "ask" || mode === "execute") return "edit";
  if (mode === "plan") return "plan";
  return "edit";
}

/**
 * Derives composer display/execution traits from Convex-backed sticky prefs.
 * Persistence lives on the session/design document — this hook does not touch
 * localStorage.
 */
export function useSessionSettings(overrides: {
  defaultModel?: string | null;
  model: AIModel;
  onModelChange?: (model: AIModel) => void;
  mode?: SessionMode;
  onModeChange?: (mode: SessionMode) => void;
  traits?: StoredModelTraits;
  onTraitsPersist?: (partial: Partial<StoredModelTraits>) => void;
  providerAccountId?: string | null;
  onProviderAccountChange?: (providerAccountId: string | null) => void;
}) {
  const model = normalizeAIModel(
    overrides.model ?? overrides.defaultModel ?? DEFAULT_AI_MODEL,
  );
  const mode = normalizeMode(overrides.mode ?? "edit");
  const providerAccountId = overrides.providerAccountId ?? null;
  const storedTraits: StoredModelTraits = {
    effortLevel: overrides.traits?.effortLevel,
    thinkingEnabled: overrides.traits?.thinkingEnabled,
    use1mContext: overrides.traits?.use1mContext,
  };

  const displayTraits = resolveTraitsForDisplay(model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(model, storedTraits);

  const setModel = (nextModel: AIModel) => {
    overrides.onModelChange?.(normalizeAIModel(nextModel));
  };

  const setMode = (nextMode: SessionMode) => {
    overrides.onModeChange?.(nextMode);
  };

  const onTraitsChange = (partial: Partial<StoredModelTraits>) => {
    overrides.onTraitsPersist?.(partial);
  };

  const setProviderAccountId = (next: string | null) => {
    overrides.onProviderAccountChange?.(next);
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
