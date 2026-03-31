"use client";

import { useCallback } from "react";
import type { ClaudeModel, ResponseLength } from "@conductor/ui";

const MODELS: ClaudeModel[] = ["opus", "sonnet", "haiku"];
const RESPONSE_LENGTHS: ResponseLength[] = ["concise", "default", "detailed"];

function isClaudeModel(v: string): v is ClaudeModel {
  return MODELS.includes(v as ClaudeModel);
}

function isResponseLength(v: string): v is ResponseLength {
  return RESPONSE_LENGTHS.includes(v as ResponseLength);
}

function storageKey(sessionId: string) {
  return `conductor:session-settings:${sessionId}`;
}

interface StoredSettings {
  model?: string;
  responseLength?: string;
}

function readSettings(sessionId: string): StoredSettings {
  try {
    const raw = sessionStorage.getItem(storageKey(sessionId));
    if (!raw) return {};
    return JSON.parse(raw) as StoredSettings;
  } catch {
    return {};
  }
}

function writeSettings(sessionId: string, settings: StoredSettings) {
  sessionStorage.setItem(storageKey(sessionId), JSON.stringify(settings));
}

export function getSessionModel(
  sessionId: string,
  fallback: ClaudeModel,
): ClaudeModel {
  const stored = readSettings(sessionId).model;
  if (stored && isClaudeModel(stored)) return stored;
  return fallback;
}

export function getSessionResponseLength(
  sessionId: string,
  fallback: ResponseLength,
): ResponseLength {
  const stored = readSettings(sessionId).responseLength;
  if (stored && isResponseLength(stored)) return stored;
  return fallback;
}

export function useSessionModelSetter(sessionId: string) {
  return useCallback(
    (model: ClaudeModel) => {
      const settings = readSettings(sessionId);
      writeSettings(sessionId, { ...settings, model });
    },
    [sessionId],
  );
}

export function useSessionResponseLengthSetter(sessionId: string) {
  return useCallback(
    (responseLength: ResponseLength) => {
      const settings = readSettings(sessionId);
      writeSettings(sessionId, { ...settings, responseLength });
    },
    [sessionId],
  );
}
