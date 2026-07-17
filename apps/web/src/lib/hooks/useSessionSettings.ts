"use client";

import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  DEFAULT_AI_MODEL,
  DEFAULT_REASONING_LEVEL,
  normalizeAIModel,
  type AIModel,
  type ReasoningLevel,
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
  reasoningLevel: ReasoningLevel;
  // The user's own provider account whose credentials run this session's turns,
  // or null for the shared team credential. Stored as a plain string id (the
  // Convex Id<"userProviderAccounts">) so it round-trips through localStorage.
  providerAccountId: string | null;
}

const DEFAULT_SETTINGS: StoredSettings = {
  model: DEFAULT_AI_MODEL,
  mode: "edit",
  reasoningLevel: DEFAULT_REASONING_LEVEL,
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

  const setModel = useCallback(
    (model: AIModel) => {
      setSettings((prev) => ({ ...prev, model: normalizeAIModel(model) }));
    },
    [setSettings],
  );

  const setMode = useCallback(
    (mode: SessionMode) => {
      setSettings((prev) => ({ ...prev, mode }));
    },
    [setSettings],
  );

  const setReasoningLevel = useCallback(
    (reasoningLevel: ReasoningLevel) => {
      setSettings((prev) => ({ ...prev, reasoningLevel }));
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
    model: normalizeAIModel(settings.model),
    mode: normalizeMode(settings.mode),
    reasoningLevel: settings.reasoningLevel ?? DEFAULT_REASONING_LEVEL,
    providerAccountId: settings.providerAccountId ?? null,
    setModel,
    setMode,
    setReasoningLevel,
    setProviderAccountId,
  };
}
