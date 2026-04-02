"use client";

import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { ClaudeModel, ResponseLength } from "@conductor/ui";

const SESSION_MODES = ["ask", "execute", "plan"] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

interface StoredSettings {
  model: ClaudeModel;
  responseLength: ResponseLength;
  mode: SessionMode;
}

const DEFAULT_SETTINGS: StoredSettings = {
  model: "sonnet",
  responseLength: "default",
  mode: "ask",
};

function storageKey(sessionId: string) {
  return `conductor:session-settings:${sessionId}`;
}

export function useSessionSettings(
  sessionId: string,
  overrides?: { defaultModel?: ClaudeModel },
) {
  const defaults: StoredSettings = overrides?.defaultModel
    ? { ...DEFAULT_SETTINGS, model: overrides.defaultModel }
    : DEFAULT_SETTINGS;

  const [settings, setSettings] = useLocalStorage(
    storageKey(sessionId),
    defaults,
  );

  const setModel = useCallback(
    (model: ClaudeModel) => {
      setSettings((prev) => ({ ...prev, model }));
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
    model: settings.model,
    mode: settings.mode,
    responseLength: settings.responseLength,
    setModel,
    setMode,
    setResponseLength,
  };
}
