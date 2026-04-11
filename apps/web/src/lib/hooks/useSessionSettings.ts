"use client";

import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { ResponseLength } from "@conductor/ui";
import {
  DEFAULT_AI_MODEL,
  normalizeAIModel,
  type AIModel,
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
  responseLength: ResponseLength;
  mode: SessionMode;
}

const DEFAULT_SETTINGS: StoredSettings = {
  model: DEFAULT_AI_MODEL,
  responseLength: "default",
  mode: "edit",
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

  const setResponseLength = useCallback(
    (responseLength: ResponseLength) => {
      setSettings((prev) => ({ ...prev, responseLength }));
    },
    [setSettings],
  );

  return {
    model: normalizeAIModel(settings.model),
    mode: normalizeMode(settings.mode),
    responseLength: settings.responseLength,
    setModel,
    setMode,
    setResponseLength,
  };
}
