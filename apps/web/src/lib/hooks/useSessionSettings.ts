"use client";

import { useCallback } from "react";
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
  overrides?: { defaultModel?: string | null },
) {
  const defaults: StoredSettings = overrides?.defaultModel
    ? { ...DEFAULT_SETTINGS, model: normalizeAIModel(overrides.defaultModel) }
    : DEFAULT_SETTINGS;

  const [settings, setSettings] = useLocalStorage(
    storageKey(sessionId),
    defaults,
  );

  const model = normalizeAIModel(settings.model);

  const storedTraits: StoredModelTraits = {
    effortLevel: settings.effortLevel,
    thinkingEnabled: settings.thinkingEnabled,
    use1mContext: settings.use1mContext,
  };

  const displayTraits = resolveTraitsForDisplay(model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(model, storedTraits);

  const setModel = useCallback(
    (nextModel: AIModel) => {
      setSettings((prev) => ({
        ...prev,
        model: normalizeAIModel(nextModel),
      }));
    },
    [setSettings],
  );

  const setMode = useCallback(
    (mode: SessionMode) => {
      setSettings((prev) => ({ ...prev, mode }));
    },
    [setSettings],
  );

  const onTraitsChange = useCallback(
    (partial: Partial<StoredModelTraits>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
    },
    [setSettings],
  );

  const setProviderAccountId = useCallback(
    (providerAccountId: string | null) => {
      setSettings((prev) => ({ ...prev, providerAccountId }));
    },
    [setSettings],
  );

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
