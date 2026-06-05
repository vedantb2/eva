"use client";

import type { Id } from "@conductor/backend";
import { cn } from "@conductor/ui";
import { useCommentReactions } from "./TaskReactionsProvider";
import { EmojiReactionPicker } from "./EmojiReactionPicker";

/**
 * Grouped reaction chips for a comment plus an "add reaction" trigger.
 * Chips the current user picked get a filled, primary-bordered look; clicking
 * any chip toggles that emoji. The picker trigger only shows on hover until the
 * comment has at least one reaction.
 */
export function ReactionBar({ commentId }: { commentId: Id<"taskComments"> }) {
  const { groups, toggle } = useCommentReactions(commentId);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {groups.map((group) => (
        <button
          key={group.emoji}
          type="button"
          onClick={() => toggle(group.emoji)}
          aria-pressed={group.reactedByMe}
          className={cn(
            "flex h-6 items-center gap-1 rounded-full border px-2 text-xs leading-none transition-colors",
            group.reactedByMe
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <span className="text-sm leading-none">{group.emoji}</span>
          <span className="tabular-nums">{group.count}</span>
        </button>
      ))}
      <EmojiReactionPicker
        onSelect={toggle}
        alwaysVisible={groups.length > 0}
      />
    </div>
  );
}
