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
  typeof api.taskCommentReactions.listByTask
>[number];

export interface ReactionGroup {
  emoji: string;
  count: number;
  // Whether the current user is one of the reactors (drives chip highlight).
  reactedByMe: boolean;
}

interface TaskReactionsContextValue {
  groupsByComment: Map<Id<"taskComments">, ReactionGroup[]>;
  toggle: (commentId: Id<"taskComments">, emoji: string) => Promise<void>;
}

const TaskReactionsContext = createContext<TaskReactionsContextValue | null>(
  null,
);

// Stable empty array so comments without reactions don't churn referential
// identity on every render.
const EMPTY_GROUPS: ReactionGroup[] = [];

/**
 * Loads every comment reaction for a task once and distributes them via
 * context, so deeply nested comment items (including recursive replies and
 * run-linked comments) read their slice without prop drilling. The toggle
 * mutation applies an optimistic update keyed off the same query.
 */
export function TaskReactionsProvider({
  taskId,
  children,
}: {
  taskId: Id<"agentTasks">;
  children: ReactNode;
}) {
  const currentUserId = useQuery(api.auth.me);
  const reactions = useQuery(api.taskCommentReactions.listByTask, { taskId });

  const toggleMutation = useMutation(
    api.taskCommentReactions.toggle,
  ).withOptimisticUpdate((localStore, args) => {
    if (!currentUserId) return;
    const current = localStore.getQuery(api.taskCommentReactions.listByTask, {
      taskId,
    });
    if (current === undefined) return;
    const existingIndex = current.findIndex(
      (reaction) =>
        reaction.commentId === args.commentId &&
        reaction.userId === currentUserId &&
        reaction.emoji === args.emoji,
    );
    const next =
      existingIndex >= 0
        ? current.filter((_, index) => index !== existingIndex)
        : [
            ...current,
            {
              commentId: args.commentId,
              userId: currentUserId,
              emoji: args.emoji,
            },
          ];
    localStore.setQuery(api.taskCommentReactions.listByTask, { taskId }, next);
  });

  const groupsByComment = useMemo(() => {
    const map = new Map<Id<"taskComments">, ReactionGroup[]>();
    if (!reactions) return map;
    // commentId -> emoji -> { count, mine }, preserving first-seen emoji order.
    const byComment = new Map<
      Id<"taskComments">,
      Map<string, { count: number; mine: boolean }>
    >();
    for (const reaction of reactions) {
      let emojiMap = byComment.get(reaction.commentId);
      if (!emojiMap) {
        emojiMap = new Map();
        byComment.set(reaction.commentId, emojiMap);
      }
      const entry = emojiMap.get(reaction.emoji) ?? { count: 0, mine: false };
      entry.count += 1;
      if (currentUserId && reaction.userId === currentUserId) {
        entry.mine = true;
      }
      emojiMap.set(reaction.emoji, entry);
    }
    for (const [commentId, emojiMap] of byComment) {
      map.set(
        commentId,
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
    async (commentId: Id<"taskComments">, emoji: string) => {
      await toggleMutation({ commentId, emoji });
    },
    [toggleMutation],
  );

  const value = useMemo<TaskReactionsContextValue>(
    () => ({ groupsByComment, toggle }),
    [groupsByComment, toggle],
  );

  return (
    <TaskReactionsContext.Provider value={value}>
      {children}
    </TaskReactionsContext.Provider>
  );
}

/** Reaction groups + a bound toggle for a single comment. */
export function useCommentReactions(commentId: Id<"taskComments">) {
  const context = useContext(TaskReactionsContext);
  if (!context) {
    throw new Error(
      "useCommentReactions must be used within a TaskReactionsProvider",
    );
  }
  const groups = context.groupsByComment.get(commentId) ?? EMPTY_GROUPS;
  const toggle = useCallback(
    (emoji: string) => context.toggle(commentId, emoji),
    [context, commentId],
  );
  return { groups, toggle };
}
