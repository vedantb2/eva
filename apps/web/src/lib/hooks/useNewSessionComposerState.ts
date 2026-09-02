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

/** Single localStorage blob for the landing composer (no session row yet). */
export interface NewSessionComposerState {
  draft: string;
  model: AIModel;
  effortLevel?: ReasoningLevel;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
  fastMode?: boolean;
  providerAccountId: string | null;
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
  effortLevel: reasoningLevelSchema.optional(),
  thinkingEnabled: z.boolean().optional(),
  use1mContext: z.boolean().optional(),
  fastMode: z.boolean().optional(),
  providerAccountId: z.string().nullable().optional(),
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

function defaultState(
  defaultModel?: string | null,
  defaultTraits?: StoredModelTraits,
): NewSessionComposerState {
  return {
    draft: "",
    model: normalizeAIModel(defaultModel ?? DEFAULT_AI_MODEL),
    effortLevel: defaultTraits?.effortLevel,
    thinkingEnabled: defaultTraits?.thinkingEnabled,
    use1mContext: defaultTraits?.use1mContext,
    fastMode: defaultTraits?.fastMode,
    providerAccountId: null,
  };
}

function normalizeStored(
  value: z.infer<typeof composerStateSchema>,
  defaultModel?: string | null,
  defaultTraits?: StoredModelTraits,
): NewSessionComposerState {
  const defaults = defaultState(defaultModel, defaultTraits);
  return {
    draft: value.draft ?? defaults.draft,
    model: normalizeAIModel(value.model ?? defaults.model),
    effortLevel: value.effortLevel ?? defaults.effortLevel,
    thinkingEnabled: value.thinkingEnabled ?? defaults.thinkingEnabled,
    use1mContext: value.use1mContext ?? defaults.use1mContext,
    fastMode: value.fastMode ?? defaults.fastMode,
    providerAccountId:
      value.providerAccountId === undefined
        ? defaults.providerAccountId
        : value.providerAccountId,
  };
}

function parseComposerState(
  raw: string,
  defaultModel?: string | null,
  defaultTraits?: StoredModelTraits,
): NewSessionComposerState | null {
  try {
    const result = storedOrLegacyDraftSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    if (typeof result.data === "string") {
      return {
        ...defaultState(defaultModel, defaultTraits),
        draft: result.data,
      };
    }
    return normalizeStored(result.data, defaultModel, defaultTraits);
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
  defaultTraits?: StoredModelTraits,
): NewSessionComposerState {
  const defaults = defaultState(defaultModel, defaultTraits);
  if (typeof window === "undefined") return defaults;

  const existingRaw = readRaw(storageKey(repoId));
  if (existingRaw !== null) {
    return (
      parseComposerState(existingRaw, defaultModel, defaultTraits) ?? defaults
    );
  }

  const legacyDraftRaw = readRaw(legacyDraftKey(repoId));
  const legacySettingsRaw = readRaw(legacySettingsKey(repoId));
  const legacyDraft =
    legacyDraftRaw !== null
      ? parseComposerState(legacyDraftRaw, defaultModel, defaultTraits)
      : null;
  const legacySettings =
    legacySettingsRaw !== null
      ? parseComposerState(legacySettingsRaw, defaultModel, defaultTraits)
      : null;

  const migrated = normalizeStored(
    {
      draft: legacyDraft?.draft ?? "",
      model: legacySettings?.model,
      effortLevel: legacySettings?.effortLevel,
      thinkingEnabled: legacySettings?.thinkingEnabled,
      use1mContext: legacySettings?.use1mContext,
      fastMode: legacySettings?.fastMode,
      providerAccountId: legacySettings?.providerAccountId,
    },
    defaultModel,
    defaultTraits,
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
  defaultTraits?: StoredModelTraits,
): NewSessionComposerState {
  return normalizeStored(
    composerStateSchema.catch({}).parse(value),
    defaultModel,
    defaultTraits,
  );
}

/**
 * Persists new-session landing composer state (draft, model, traits, account)
 * in one localStorage object per repo.
 */
export function useNewSessionComposerState(
  repoId: Id<"githubRepos">,
  defaultModel?: string | null,
  defaultTraits?: StoredModelTraits,
) {
  const [state, setState] = useLocalStorage(
    storageKey(repoId),
    loadOrMigrate(repoId, defaultModel, defaultTraits),
  );

  const normalized = coerceState(state, defaultModel, defaultTraits);
  const storedTraits: StoredModelTraits = {
    effortLevel: normalized.effortLevel,
    thinkingEnabled: normalized.thinkingEnabled,
    use1mContext: normalized.use1mContext,
    fastMode: normalized.fastMode,
  };
  const displayTraits = resolveTraitsForDisplay(normalized.model, storedTraits);
  const executionTraits = buildTraitsExecutionPayload(
    normalized.model,
    storedTraits,
  );

  const patch = (partial: Partial<NewSessionComposerState>) => {
    setState((prev) => ({
      ...coerceState(prev, defaultModel, defaultTraits),
      ...partial,
    }));
  };

  return {
    draft: normalized.draft,
    model: normalized.model,
    providerAccountId: normalized.providerAccountId,
    displayTraits,
    executionTraits,
    setDraft: (draft: string) => {
      patch({ draft });
    },
    setModel: (nextModel: AIModel) => {
      patch({ model: normalizeAIModel(nextModel) });
    },
    onTraitsChange: (partial: Partial<StoredModelTraits>) => {
      patch(partial);
    },
    setProviderAccountId: (providerAccountId: string | null) => {
      patch({ providerAccountId });
    },
    /** Clear only the prompt draft after a session is created; keep prefs. */
    clearDraft: () => {
      patch({ draft: "" });
    },
  };
}
