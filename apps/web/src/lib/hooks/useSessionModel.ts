"use client";

import {
  api,
  normalizeAIModel,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@conductor/backend";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";

/**
 * Session composer model + traits backed by Convex (`sessions.lastModel`,
 * `lastReasoningLevel`, `lastThinkingEnabled`, `lastUse1mContext`) as the
 * source of truth. Read straight off the live `sessions.get` query — no
 * mirrored `useState` — so picks stay sticky across reloads, tabs, and devices.
 *
 * Changes go through `sessions.setModel` / `sessions.setTraits` with optimistic
 * patches of the cached query. While the session query is still loading the
 * picker shows `defaultModel` and model-default traits.
 */
export function useSessionModel(
  sessionId: Id<"sessions">,
  defaultModel: AIModel,
): {
  model: AIModel;
  setModel: (model: AIModel) => void;
  /** Sticky traits from Convex; undefined fields fall back to localStorage. */
  traits: StoredModelTraits;
  setTraits: (partial: Partial<StoredModelTraits>) => void;
} {
  const session = useQuery(api.sessions.get, { id: sessionId });
  const setModelMutation = useMutation(
    api.sessions.setModel,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.sessions.get, { id: args.id });
    if (!current) return;
    localStore.setQuery(
      api.sessions.get,
      { id: args.id },
      { ...current, lastModel: args.model },
    );
  });
  const setTraitsMutation = useMutation(
    api.sessions.setTraits,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.sessions.get, { id: args.id });
    if (!current) return;
    localStore.setQuery(
      api.sessions.get,
      { id: args.id },
      {
        ...current,
        ...(args.reasoningLevel !== undefined
          ? { lastReasoningLevel: args.reasoningLevel }
          : {}),
        ...(args.thinkingEnabled !== undefined
          ? { lastThinkingEnabled: args.thinkingEnabled }
          : {}),
        ...(args.use1mContext !== undefined
          ? { lastUse1mContext: args.use1mContext }
          : {}),
      },
    );
  });

  const model = normalizeAIModel(session?.lastModel ?? defaultModel);

  const setModel = (nextModel: AIModel) => {
    void setModelMutation({
      id: sessionId,
      model: normalizeAIModel(nextModel),
    });
  };

  const setTraits = (partial: Partial<StoredModelTraits>) => {
    const reasoningLevel: ReasoningLevel | undefined = partial.effortLevel;
    void setTraitsMutation({
      id: sessionId,
      ...(reasoningLevel !== undefined ? { reasoningLevel } : {}),
      ...(partial.thinkingEnabled !== undefined
        ? { thinkingEnabled: partial.thinkingEnabled }
        : {}),
      ...(partial.use1mContext !== undefined
        ? { use1mContext: partial.use1mContext }
        : {}),
    });
  };

  return {
    model,
    setModel,
    traits: {
      effortLevel: session?.lastReasoningLevel,
      thinkingEnabled: session?.lastThinkingEnabled,
      use1mContext: session?.lastUse1mContext,
    },
    setTraits,
  };
}
