"use client";

import {
  api,
  normalizeAIModel,
  type AIModel,
  type Id,
  type ReasoningLevel,
} from "@conductor/backend";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";

/**
 * Session composer model + reasoning effort backed by Convex
 * (`sessions.lastModel` / `sessions.lastReasoningLevel`) as the source of truth.
 * Read straight off the live `sessions.get` query — no mirrored `useState` —
 * so both stay sticky across reloads, tabs, and devices.
 *
 * Changes go through `sessions.setModel` / `sessions.setReasoningLevel` with
 * optimistic patches of the cached query. While the session query is still
 * loading the picker shows `defaultModel` and model-default effort.
 */
export function useSessionModel(
  sessionId: Id<"sessions">,
  defaultModel: AIModel,
): {
  model: AIModel;
  setModel: (model: AIModel) => void;
  effortLevel: ReasoningLevel | undefined;
  setEffortLevel: (effortLevel: ReasoningLevel) => void;
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
  const setReasoningLevelMutation = useMutation(
    api.sessions.setReasoningLevel,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.sessions.get, { id: args.id });
    if (!current) return;
    localStore.setQuery(
      api.sessions.get,
      { id: args.id },
      { ...current, lastReasoningLevel: args.reasoningLevel },
    );
  });

  const model = normalizeAIModel(session?.lastModel ?? defaultModel);

  const setModel = (nextModel: AIModel) => {
    void setModelMutation({
      id: sessionId,
      model: normalizeAIModel(nextModel),
    });
  };

  const setEffortLevel = (effortLevel: ReasoningLevel) => {
    void setReasoningLevelMutation({
      id: sessionId,
      reasoningLevel: effortLevel,
    });
  };

  return {
    model,
    setModel,
    effortLevel: session?.lastReasoningLevel,
    setEffortLevel,
  };
}
