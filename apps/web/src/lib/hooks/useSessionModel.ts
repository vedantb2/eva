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
import {
  normalizeMode,
  type SessionMode,
} from "@/lib/hooks/useSessionSettings";

/**
 * Session composer prefs backed by Convex (`sessions.lastModel` / `lastMode` /
 * trait fields / `providerAccountId`) as the source of truth. Read straight
 * off the live `sessions.get` query — no mirrored `useState` — so picks stay
 * sticky across reloads, tabs, and devices.
 *
 * Changes go through sticky setters with optimistic patches. While the session
 * query is still loading the picker shows `defaultModel`, mode `"edit"`,
 * model-default traits, and Team account.
 */
export function useSessionModel(
  sessionId: Id<"sessions">,
  defaultModel: AIModel,
): {
  model: AIModel;
  setModel: (model: AIModel) => void;
  mode: SessionMode | undefined;
  setMode: (mode: SessionMode) => void;
  /** Sticky traits from Convex; undefined fields use model defaults. */
  traits: StoredModelTraits;
  setTraits: (partial: Partial<StoredModelTraits>) => void;
  /** undefined while session loading — treat as Team until the query lands. */
  providerAccountId: string | null | undefined;
  setProviderAccountId: (
    providerAccountId: Id<"userProviderAccounts"> | null,
  ) => void;
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
  const setModeMutation = useMutation(
    api.sessions.setMode,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.sessions.get, { id: args.id });
    if (!current) return;
    localStore.setQuery(
      api.sessions.get,
      { id: args.id },
      { ...current, lastMode: args.mode },
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

  const setMode = (mode: SessionMode) => {
    void setModeMutation({ id: sessionId, mode });
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

  const setProviderAccountId = (
    providerAccountId: Id<"userProviderAccounts"> | null,
  ) => {
    void setProviderAccountIdMutation({ id: sessionId, providerAccountId });
  };

  return {
    model,
    setModel,
    mode:
      session?.lastMode !== undefined
        ? normalizeMode(session.lastMode)
        : undefined,
    setMode,
    traits: {
      effortLevel: session?.lastReasoningLevel,
      thinkingEnabled: session?.lastThinkingEnabled,
      use1mContext: session?.lastUse1mContext,
    },
    setTraits,
    providerAccountId:
      session === undefined ? undefined : (session?.providerAccountId ?? null),
    setProviderAccountId,
  };
}
