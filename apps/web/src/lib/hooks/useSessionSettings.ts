"use client";

import { useEffect, useRef } from "react";
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
  overrides?: { defaultModel?: string | null; seedModel?: string | null },
) {
  const defaults: StoredSettings = overrides?.defaultModel
    ? { ...DEFAULT_SETTINGS, model: normalizeAIModel(overrides.defaultModel) }
    : DEFAULT_SETTINGS;

  const [settings, setSettings] = useLocalStorage(
    storageKey(sessionId),
    defaults,
  );

  // Seed the model once per session from the session's persisted `lastModel`
  // (server source of truth) when the user has no local override yet. Without
  // this, a freshly created session has no localStorage entry and the picker
  // falls back to the repo default, so follow-up prompts silently switch off
  // the model the session was started with. Guarded per sessionId so later
  // reactive session updates never clobber an unsent in-session pick.
  const seededForSession = useRef<string | null>(null);
  useEffect(() => {
    if (seededForSession.current === sessionId) return;
    const seed = overrides?.seedModel;
    if (seed == null) return;
    seededForSession.current = sessionId;
    if (window.localStorage.getItem(storageKey(sessionId)) !== null) return;
    setSettings((prev) => ({ ...prev, model: normalizeAIModel(seed) }));
  }, [overrides?.seedModel, sessionId, setSettings]);

  const model = normalizeAIModel(settings.model);

  const storedTraits: StoredModelTraits = {
    effortLevel: settings.effortLevel,
    thinkingEnabled: settings.thinkingEnabled,
    use1mContext: settings.use1mContext,
  };

  const displayTraits = resolveTraitsForDisplay(model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(model, storedTraits);

  const setModel = (nextModel: AIModel) => {
    setSettings((prev) => ({
      ...prev,
      model: normalizeAIModel(nextModel),
    }));
  };

  const setMode = (mode: SessionMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  };

  const onTraitsChange = (partial: Partial<StoredModelTraits>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
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
