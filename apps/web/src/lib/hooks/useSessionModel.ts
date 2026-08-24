"use client";

import {
  api,
  normalizeAIModel,
  type AIModel,
  type AIProvider,
  type Id,
  type ReasoningLevel,
  type StoredModelTraits,
} from "@eva/backend";
import { useAction, useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useState } from "react";

/**
 * Session composer prefs backed by Convex (`sessions.lastModel` / trait fields
 * / `providerAccountId`) as the source of truth. Read straight off the live
 * `sessions.get` query — no mirrored `useState` — so picks stay sticky across
 * reloads, tabs, and devices.
 *
 * Changes go through sticky setters with optimistic patches. While the session
 * query is still loading the picker shows `defaultModel`, model-default traits,
 * and Team account.
 */
export function useSessionModel(
  sessionId: Id<"sessions">,
  defaultModel: AIModel,
): {
  model: AIModel;
  setModel: (model: AIModel) => void;
  /** Sticky traits from Convex; undefined fields use model defaults. */
  traits: StoredModelTraits;
  setTraits: (partial: Partial<StoredModelTraits>) => void;
  /** undefined while session loading — treat as Team until the query lands. */
  providerAccountId: string | null | undefined;
  setProviderAccountId: (
    providerAccountId: Id<"userProviderAccounts"> | null,
  ) => void;
  isSwitchingAccount: boolean;
  /**
   * Provider this session is pinned to; undefined while loading and on
   * sessions created before the lock. Feed it to
   * `getLockedProviderModelOptions` so the picker cannot offer a model the
   * session mutations will reject.
   */
  lockedProvider: AIProvider | undefined;
} {
  const session = useQuery(api.sessions.get, { id: sessionId });
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const prewarmDaemonNow = useAction(api.sessionWorkflow.prewarmDaemonNow);
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
  const setProviderAccountIdMutation = useMutation(
    api.sessions.setProviderAccountId,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.sessions.get, { id: args.id });
    if (!current) return;
    localStore.setQuery(
      api.sessions.get,
      { id: args.id },
      {
        ...current,
        providerAccountId:
          args.providerAccountId === null ? undefined : args.providerAccountId,
      },
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
        ...(args.fastMode !== undefined ? { lastFastMode: args.fastMode } : {}),
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
      ...(partial.fastMode !== undefined ? { fastMode: partial.fastMode } : {}),
    });
  };

  const setProviderAccountId = (
    providerAccountId: Id<"userProviderAccounts"> | null,
  ) => {
    void (async () => {
      setIsSwitchingAccount(true);
      try {
        await setProviderAccountIdMutation({
          id: sessionId,
          providerAccountId,
        });
        await prewarmDaemonNow({ sessionId });
      } finally {
        setIsSwitchingAccount(false);
      }
    })();
  };

  return {
    model,
    setModel,
    traits: {
      effortLevel: session?.lastReasoningLevel,
      thinkingEnabled: session?.lastThinkingEnabled,
      use1mContext: session?.lastUse1mContext,
      fastMode: session?.lastFastMode,
    },
    setTraits,
    providerAccountId:
      session === undefined ? undefined : (session?.providerAccountId ?? null),
    setProviderAccountId,
    isSwitchingAccount,
    lockedProvider: session?.provider,
  };
}
