"use client";

import {
  api,
  normalizeAIModel,
  type AIModel,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@eva/backend";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";

/**
 * Design-session composer prefs backed by Convex (`designSessions.lastModel` /
 * trait fields / `providerAccountId`). Same sticky contract as coding sessions.
 */
export function useDesignSessionModel(
  designSessionId: Id<"designSessions">,
  defaultModel: AIModel,
): {
  model: AIModel;
  setModel: (model: AIModel) => void;
  traits: StoredModelTraits;
  setTraits: (partial: Partial<StoredModelTraits>) => void;
  providerAccountId: string | null | undefined;
  setProviderAccountId: (
    providerAccountId: Id<"userProviderAccounts"> | null,
  ) => void;
} {
  const session = useQuery(api.designSessions.get, { id: designSessionId });
  const setModelMutation = useMutation(
    api.designSessions.setModel,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.designSessions.get, {
      id: args.id,
    });
    if (!current) return;
    localStore.setQuery(
      api.designSessions.get,
      { id: args.id },
      { ...current, lastModel: args.model },
    );
  });
  const setProviderAccountIdMutation = useMutation(
    api.designSessions.setProviderAccountId,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.designSessions.get, {
      id: args.id,
    });
    if (!current) return;
    localStore.setQuery(
      api.designSessions.get,
      { id: args.id },
      {
        ...current,
        providerAccountId:
          args.providerAccountId === null ? undefined : args.providerAccountId,
      },
    );
  });
  const setTraitsMutation = useMutation(
    api.designSessions.setTraits,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.designSessions.get, {
      id: args.id,
    });
    if (!current) return;
    localStore.setQuery(
      api.designSessions.get,
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

  return {
    model,
    setModel: (nextModel: AIModel) => {
      void setModelMutation({
        id: designSessionId,
        model: normalizeAIModel(nextModel),
      });
    },
    traits: {
      effortLevel: session?.lastReasoningLevel,
      thinkingEnabled: session?.lastThinkingEnabled,
      use1mContext: session?.lastUse1mContext,
    },
    setTraits: (partial: Partial<StoredModelTraits>) => {
      const reasoningLevel: ReasoningLevel | undefined = partial.effortLevel;
      void setTraitsMutation({
        id: designSessionId,
        ...(reasoningLevel !== undefined ? { reasoningLevel } : {}),
        ...(partial.thinkingEnabled !== undefined
          ? { thinkingEnabled: partial.thinkingEnabled }
          : {}),
        ...(partial.use1mContext !== undefined
          ? { use1mContext: partial.use1mContext }
          : {}),
      });
    },
    providerAccountId:
      session === undefined ? undefined : (session?.providerAccountId ?? null),
    setProviderAccountId: (
      providerAccountId: Id<"userProviderAccounts"> | null,
    ) => {
      void setProviderAccountIdMutation({
        id: designSessionId,
        providerAccountId,
      });
    },
  };
}
