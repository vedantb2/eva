"use client";

import { cn, HoverCard, HoverCardContent, HoverCardTrigger } from "@eva/ui";
import { UserInitials } from "@eva/shared";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import type { ReactionGroup } from "./TaskReactionsProvider";

interface ReactionBarProps {
  groups: ReactionGroup[];
  toggle: (emoji: string) => void;
}

/**
 * Grouped reaction chips for a comment. Renders nothing until the comment has
 * at least one reaction â€” the primary "add reaction" entry point lives in the
 * comment header. Once reactions exist, an inline picker trigger is kept
 * alongside the chips for convenience (so it's available in both places). Chips
 * the current user picked are highlighted; click any chip to toggle that emoji.
 */
export function ReactionBar({ groups, toggle }: ReactionBarProps) {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {groups.map((group) => (
        <HoverCard key={group.emoji}>
          <HoverCardTrigger asChild>
            <button
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
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-auto min-w-40 p-2">
            <div className="flex flex-col gap-1.5">
              {group.reactors.map((reactor) => (
                <div key={reactor.userId} className="flex items-center gap-2">
                  <UserInitials
                    userId={reactor.userId}
                    size="sm"
                    hideLastSeen
                    disableProfileCard
                  />
                  <span data-pii className="text-sm text-foreground">
                    {reactor.name}
                  </span>
                </div>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
      <EmojiReactionPicker onSelect={toggle} alwaysVisible />
    </div>
  );
}
