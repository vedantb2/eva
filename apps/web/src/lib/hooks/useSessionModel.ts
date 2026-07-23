"use client";

import {
  api,
  normalizeAIModel,
  type AIModel,
  type Id,
} from "@conductor/backend";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";

/**
 * Session composer model backed by Convex (`sessions.lastModel`) as the single
 * source of truth. The value is read straight off the live `sessions.get`
 * query — no localStorage, no mirrored `useState` — so it stays sticky across
 * reloads, tabs, and devices and never silently falls back to the repo default
 * on a follow-up prompt.
 *
 * Changes are written through the `sessions.setModel` mutation with an
 * optimistic patch of the cached query, giving instant picker feedback without
 * waiting for the server round-trip. While the session query is still loading
 * (or inaccessible) the picker shows `defaultModel`.
 */
export function useSessionModel(
  sessionId: Id<"sessions">,
  defaultModel: AIModel,
): { model: AIModel; setModel: (model: AIModel) => void } {
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

  const model = normalizeAIModel(session?.lastModel ?? defaultModel);

  const setModel = (nextModel: AIModel) => {
    void setModelMutation({
      id: sessionId,
      model: normalizeAIModel(nextModel),
    });
  };

  return { model, setModel };
}
