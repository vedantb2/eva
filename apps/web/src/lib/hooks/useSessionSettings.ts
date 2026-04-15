"use client";

import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { ResponseLength } from "@conductor/ui";
import {
  DEFAULT_AI_MODEL,
  normalizeAIModel,
  type AIModel,
} from "@conductor/backend";

const SESSION_MODES = ["ask", "execute", "plan"] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

interface StoredSettings {
  model: AIModel;
  responseLength: ResponseLength;
  mode: SessionMode;
}

const DEFAULT_SETTINGS: StoredSettings = {
  model: DEFAULT_AI_MODEL,
  responseLength: "default",
  mode: "ask",
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
    mode: settings.mode,
    responseLength: settings.responseLength,
    setModel,
    setMode,
    setResponseLength,
  };
}
