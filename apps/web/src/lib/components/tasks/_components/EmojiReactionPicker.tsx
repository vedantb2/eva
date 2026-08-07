"use client";

import { useState } from "react";
import { EmojiPicker } from "frimousse";
import { Popover, PopoverContent, PopoverTrigger, cn } from "@eva/ui";
import { IconMoodSmile } from "@tabler/icons-react";

// Fast-path reactions shown above the full searchable grid.
const QUICK_REACTIONS = ["👍", "❤️", "🎉", "😄", "🚀", "👀"];

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
  // When the comment already has reactions the trigger stays visible; otherwise
  // it only appears on hover/focus of the comment to keep the row uncluttered.
  alwaysVisible?: boolean;
  // "pill" = bordered chip beside the reaction chips; "ghost" = icon button
  // matching the comment-header actions (e.g. next to the options menu).
  variant?: "pill" | "ghost";
}

/**
 * "Add reaction" trigger + popover. A quick-react row sits above a full
 * frimousse emoji picker (unstyled, virtualized; styled here against our
 * surface tokens). Selecting from either path fires `onSelect` and closes.
 */
export function EmojiReactionPicker({
  onSelect,
  alwaysVisible,
  variant = "pill",
}: EmojiReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const choose = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  const triggerClassName = cn(
    "flex items-center justify-center text-muted-foreground transition-[opacity,background-color,color] hover:text-foreground focus-visible:opacity-100 data-[state=open]:text-foreground data-[state=open]:opacity-100",
    variant === "ghost"
      ? "size-7 rounded-md hover:bg-muted/60 data-[state=open]:bg-muted"
      : "h-6 rounded-full bg-muted/40 px-2 hover:bg-muted data-[state=open]:bg-muted",
    !alwaysVisible &&
      "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Add reaction"
          className={triggerClassName}
        >
          <IconMoodSmile className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-fit overflow-hidden p-0">
        <div className="flex items-center gap-0.5 border-b border-border p-1.5">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => choose(emoji)}
              aria-label={`React with ${emoji}`}
              className="flex size-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
        <EmojiPicker.Root
          onEmojiSelect={({ emoji }) => choose(emoji)}
          className="isolate flex h-75 w-72 flex-col bg-popover/95 text-popover-foreground backdrop-blur-md"
        >
          <EmojiPicker.Search className="z-10 mx-2 mt-2 appearance-none rounded-control border border-input bg-popover px-2.5 py-2 text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ring/45" />
          <EmojiPicker.Viewport className="relative flex-1 outline-hidden">
            <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Loading…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No emoji found.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="select-none pb-1.5"
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="bg-popover px-3 pb-1.5 pt-3 text-xs font-medium text-muted-foreground"
                    {...props}
                  >
                    {category.label}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div className="scroll-my-1.5 px-1.5" {...props}>
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded-md text-lg transition-colors data-active:bg-muted"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      </PopoverContent>
    </Popover>
  );
}
