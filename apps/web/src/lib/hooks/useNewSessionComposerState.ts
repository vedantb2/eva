"use client";

import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";
import {
  DEFAULT_AI_MODEL,
  buildTraitsExecutionPayload,
  normalizeAIModel,
  resolveTraitsForDisplay,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@eva/backend";
import {
  normalizeMode,
  type SessionMode,
} from "@/lib/hooks/useSessionSettings";

/** Single localStorage blob for the landing composer (no session row yet). */
export interface NewSessionComposerState {
  draft: string;
  model: AIModel;
  mode: SessionMode;
  effortLevel?: ReasoningLevel;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
  providerAccountId: string | null;
  numDesigns?: number;
}

const reasoningLevelSchema = z.enum([
  "off",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

const composerStateSchema = z.object({
  draft: z.string().optional(),
  model: z.string().optional(),
  mode: z.string().optional(),
  effortLevel: reasoningLevelSchema.optional(),
  thinkingEnabled: z.boolean().optional(),
  use1mContext: z.boolean().optional(),
  providerAccountId: z.string().nullable().optional(),
  numDesigns: z.number().int().min(1).max(5).optional(),
});

const storedOrLegacyDraftSchema = composerStateSchema.or(z.string());

function storageKey(repoId: Id<"githubRepos">) {
  return `eva:new-session-composer:${repoId}`;
}

function legacyDraftKey(repoId: Id<"githubRepos">) {
  return `eva:new-session-draft:${repoId}`;
}

function legacySettingsKey(repoId: Id<"githubRepos">) {
  return `eva:session-settings:new-session-${repoId}`;
}

function defaultState(defaultModel?: string | null): NewSessionComposerState {
  return {
    draft: "",
    model: normalizeAIModel(defaultModel ?? DEFAULT_AI_MODEL),
    mode: "edit",
    providerAccountId: null,
    numDesigns: 3,
  };
}

function normalizeStored(
  value: z.infer<typeof composerStateSchema>,
  defaultModel?: string | null,
): NewSessionComposerState {
  const defaults = defaultState(defaultModel);
  return {
    draft: value.draft ?? defaults.draft,
    model: normalizeAIModel(value.model ?? defaults.model),
    mode: normalizeMode(value.mode ?? defaults.mode),
    effortLevel: value.effortLevel,
    thinkingEnabled: value.thinkingEnabled,
    use1mContext: value.use1mContext,
    providerAccountId:
      value.providerAccountId === undefined
        ? defaults.providerAccountId
        : value.providerAccountId,
    numDesigns: value.numDesigns ?? defaults.numDesigns,
  };
}

function parseComposerState(
  raw: string,
  defaultModel?: string | null,
): NewSessionComposerState | null {
  try {
    const result = storedOrLegacyDraftSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    if (typeof result.data === "string") {
      return { ...defaultState(defaultModel), draft: result.data };
    }
    return normalizeStored(result.data, defaultModel);
  } catch {
    return null;
  }
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Initial value for the unified key. Migrates legacy draft + session-settings
 * keys once, then removes them so we don't keep two sources of truth.
 */
function loadOrMigrate(
  repoId: Id<"githubRepos">,
  defaultModel?: string | null,
): NewSessionComposerState {
  const defaults = defaultState(defaultModel);
  if (typeof window === "undefined") return defaults;

  const existingRaw = readRaw(storageKey(repoId));
  if (existingRaw !== null) {
    return parseComposerState(existingRaw, defaultModel) ?? defaults;
  }

  const legacyDraftRaw = readRaw(legacyDraftKey(repoId));
  const legacySettingsRaw = readRaw(legacySettingsKey(repoId));
  const legacyDraft =
    legacyDraftRaw !== null
      ? parseComposerState(legacyDraftRaw, defaultModel)
      : null;
  const legacySettings =
    legacySettingsRaw !== null
      ? parseComposerState(legacySettingsRaw, defaultModel)
      : null;

  const migrated = normalizeStored(
    {
      draft: legacyDraft?.draft ?? "",
      model: legacySettings?.model,
      mode: legacySettings?.mode,
      effortLevel: legacySettings?.effortLevel,
      thinkingEnabled: legacySettings?.thinkingEnabled,
      use1mContext: legacySettings?.use1mContext,
      providerAccountId: legacySettings?.providerAccountId,
    },
    defaultModel,
  );

  try {
    window.localStorage.removeItem(legacyDraftKey(repoId));
    window.localStorage.removeItem(legacySettingsKey(repoId));
  } catch {
    // Ignore quota / private mode.
  }

  return migrated;
}

function coerceState(
  value: NewSessionComposerState,
  defaultModel?: string | null,
): NewSessionComposerState {
  return normalizeStored(
    composerStateSchema.catch({}).parse(value),
    defaultModel,
  );
}

/**
 * Persists new-session landing composer state (draft, model, mode, traits,
 * account) in one localStorage object per repo.
 */
export function useNewSessionComposerState(
  repoId: Id<"githubRepos">,
  defaultModel?: string | null,
) {
  const [state, setState] = useLocalStorage(
    storageKey(repoId),
    loadOrMigrate(repoId, defaultModel),
  );

  const normalized = coerceState(state, defaultModel);
  const storedTraits: StoredModelTraits = {
    effortLevel: normalized.effortLevel,
    thinkingEnabled: normalized.thinkingEnabled,
    use1mContext: normalized.use1mContext,
  };
  const displayTraits = resolveTraitsForDisplay(normalized.model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(
    normalized.model,
    storedTraits,
  );

  const patch = (partial: Partial<NewSessionComposerState>) => {
    setState((prev) => ({
      ...coerceState(prev, defaultModel),
      ...partial,
    }));
  };

  return {
    draft: normalized.draft,
    model: normalized.model,
    mode: normalized.mode,
    providerAccountId: normalized.providerAccountId,
    storedTraits,
    displayTraits,
    executionTraits,
    setDraft: (draft: string) => {
      patch({ draft });
    },
    setModel: (nextModel: AIModel) => {
      patch({ model: normalizeAIModel(nextModel) });
    },
    setMode: (mode: SessionMode) => {
      patch({ mode });
    },
    onTraitsChange: (partial: Partial<StoredModelTraits>) => {
      patch(partial);
    },
    setProviderAccountId: (providerAccountId: string | null) => {
      patch({ providerAccountId });
    },
    numDesigns: normalized.numDesigns ?? 3,
    setNumDesigns: (numDesigns: number) => {
      patch({ numDesigns });
    },
    /** Clear only the prompt draft after a session is created; keep prefs. */
    clearDraft: () => {
      patch({ draft: "" });
    },
  };
}
