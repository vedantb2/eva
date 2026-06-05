"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";

type ReactionView = FunctionReturnType<
  typeof api.taskReactions.listByTask
>[number];

// "comment" | "description" — sourced from the backend validator so the union
// stays in sync with the schema.
export type ReactionTargetType = ReactionView["targetType"];

export interface ReactionGroup {
  emoji: string;
  count: number;
  // Whether the current user is one of the reactors (drives chip highlight).
  reactedByMe: boolean;
}

interface TaskReactionsContextValue {
  groupsByTarget: Map<string, ReactionGroup[]>;
  toggle: (
    targetType: ReactionTargetType,
    targetId: string,
    emoji: string,
  ) => Promise<void>;
}

const TaskReactionsContext = createContext<TaskReactionsContextValue | null>(
  null,
);

// Stable empty array so targets without reactions don't churn referential
// identity on every render.
const EMPTY_GROUPS: ReactionGroup[] = [];

// Composite key for the grouped map — a target is (type, id).
function targetKey(targetType: ReactionTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}

/**
 * Loads every reaction for a task once and distributes them via context, so any
 * reactable surface (comments, their nested replies, the task description) reads
 * its slice without prop drilling. The toggle mutation applies an optimistic
 * update keyed off the same query.
 */
export function TaskReactionsProvider({
  taskId,
  children,
}: {
  taskId: Id<"agentTasks">;
  children: ReactNode;
}) {
  const currentUserId = useQuery(api.auth.me);
  const reactions = useQuery(api.taskReactions.listByTask, { taskId });

  const toggleMutation = useMutation(
    api.taskReactions.toggle,
  ).withOptimisticUpdate((localStore, args) => {
    if (!currentUserId) return;
    const current = localStore.getQuery(api.taskReactions.listByTask, {
      taskId,
    });
    if (current === undefined) return;
    const existingIndex = current.findIndex(
      (reaction) =>
        reaction.targetType === args.targetType &&
        reaction.targetId === args.targetId &&
        reaction.userId === currentUserId &&
        reaction.emoji === args.emoji,
    );
    const next =
      existingIndex >= 0
        ? current.filter((_, index) => index !== existingIndex)
        : [
            ...current,
            {
              targetType: args.targetType,
              targetId: args.targetId,
              userId: currentUserId,
              emoji: args.emoji,
            },
          ];
    localStore.setQuery(api.taskReactions.listByTask, { taskId }, next);
  });

  const groupsByTarget = useMemo(() => {
    const map = new Map<string, ReactionGroup[]>();
    if (!reactions) return map;
    // targetKey -> emoji -> { count, mine }, preserving first-seen emoji order.
    const byTarget = new Map<
      string,
      Map<string, { count: number; mine: boolean }>
    >();
    for (const reaction of reactions) {
      const key = targetKey(reaction.targetType, reaction.targetId);
      let emojiMap = byTarget.get(key);
      if (!emojiMap) {
        emojiMap = new Map();
        byTarget.set(key, emojiMap);
      }
      const entry = emojiMap.get(reaction.emoji) ?? { count: 0, mine: false };
      entry.count += 1;
      if (currentUserId && reaction.userId === currentUserId) {
        entry.mine = true;
      }
      emojiMap.set(reaction.emoji, entry);
    }
    for (const [key, emojiMap] of byTarget) {
      map.set(
        key,
        [...emojiMap.entries()].map(([emoji, entry]) => ({
          emoji,
          count: entry.count,
          reactedByMe: entry.mine,
        })),
      );
    }
    return map;
  }, [reactions, currentUserId]);

  const toggle = useCallback(
    async (targetType: ReactionTargetType, targetId: string, emoji: string) => {
      await toggleMutation({ taskId, targetType, targetId, emoji });
    },
    [toggleMutation, taskId],
  );

  const value = useMemo<TaskReactionsContextValue>(
    () => ({ groupsByTarget, toggle }),
    [groupsByTarget, toggle],
  );

  return (
    <TaskReactionsContext.Provider value={value}>
      {children}
    </TaskReactionsContext.Provider>
  );
}

/** Reaction groups + a bound toggle for a single reactable target. */
export function useReactions(targetType: ReactionTargetType, targetId: string) {
  const context = useContext(TaskReactionsContext);
  if (!context) {
    throw new Error("useReactions must be used within a TaskReactionsProvider");
  }
  const groups =
    context.groupsByTarget.get(targetKey(targetType, targetId)) ?? EMPTY_GROUPS;
  const toggle = useCallback(
    (emoji: string) => context.toggle(targetType, targetId, emoji),
    [context, targetType, targetId],
  );
  return { groups, toggle };
}
