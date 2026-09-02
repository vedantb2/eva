"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import { useShortcut } from "@/lib/hotkeys/useShortcut";
import { ShortcutKbd } from "@/lib/components/ui/Kbd";
import { m } from "motion/react";
import {
  Command,
  CommandEmpty,
  CommandList,
  motionSpring,
  Popover,
  PopoverAnchor,
  PopoverContent,
  usePromptInputController,
} from "@eva/ui";
import { IconBookmark, IconChevronDown } from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import type { MentionTextareaHandle } from "@/lib/components/chat/MentionTextarea";
import { ComposerStashItem } from "@/lib/components/chat/_components/ComposerStashItem";
import { useComposerStash } from "@/lib/components/chat/_components/useComposerStash";

/**
 * Shoulder tab + attached drawer for the composer's prompt stash, plus the
 * dock the tasks/queued panels sit in. The tab rests on the input card's top
 * edge beside those panels, and the drawer opens flush above the card by
 * anchoring a popover to the input chrome this component wraps.
 *
 * The hotkey registration stays enabled whenever a composer is mounted and the
 * focus/disabled gate lives inside the callback: `enabled: false` makes the
 * hotkey manager skip preventDefault entirely, so gating via `enabled` let
 * ⌘S fall through to the browser's save-file dialog. Browser save is never
 * useful inside the app; acting on the stash still requires this composer to
 * own focus (or its drawer to be open), so multiple mounted composers don't
 * all stash at once.
 */
export function ComposerStash({
  repoId,
  mentionRef,
  disabled,
  panels,
  children,
}: {
  repoId: Id<"githubRepos">;
  mentionRef: RefObject<MentionTextareaHandle | null>;
  disabled: boolean;
  /** Panels stacked flush above the input (tasks, queued messages). */
  panels: ReactNode;
  /** The composer input chrome the drawer anchors to. */
  children: ReactNode;
}) {
  const { textInput, attachments } = usePromptInputController();
  const { entries, stash, restore, removeEntry } = useComposerStash({
    repoId,
    mentionRef,
  });

  const [open, setOpen] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  useShortcut(
    "stashDraft",
    (event) => {
      event.preventDefault();
      if (disabled) return;
      // The drawer is portaled, so while open the active element sits outside
      // `rootRef` — hence the `open` short-circuit.
      if (!open && !rootRef.current?.contains(document.activeElement)) return;

      const isEmpty =
        textInput.value.trim().length === 0 && attachments.files.length === 0;
      if (isEmpty) {
        setOpen((prev) => !prev);
        return;
      }

      void stash().then((ok) => {
        if (ok) setPulseKey((key) => key + 1);
      });
    },
    { requireReset: true },
  );

  const newestId = entries[0]?._id;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <div ref={rootRef} className="flex flex-col">
        {/* Dock: panels column on the left, stash tab on the right, both
            resting on the input card's top edge. The dock owns the inset, so
            the panels inside it are full width. */}
        <div className="mx-auto flex w-[calc(100%-1.5rem)] items-end gap-1">
          <div className="flex min-w-0 flex-1 flex-col">{panels}</div>
          {entries.length > 0 ? (
            <button
              ref={tabRef}
              type="button"
              aria-expanded={open}
              aria-label={`Prompt stash, ${entries.length} saved`}
              title="Prompt stash"
              className="motion-press inline-flex h-7 shrink-0 items-center gap-1.5 rounded-b-none rounded-t-surface bg-muted/50 px-2.5 text-xs text-muted-foreground hover:text-foreground active:scale-[0.98]"
              // Keep composer focus when toggling from the input.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => setOpen((prev) => !prev)}
            >
              <IconBookmark aria-hidden className="size-3.5" />
              <span>Stash</span>
              <m.span
                key={pulseKey}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionSpring}
                className="font-medium tabular-nums"
              >
                {entries.length}
              </m.span>
            </button>
          ) : null}
        </div>
        <PopoverAnchor asChild>
          <div>{children}</div>
        </PopoverAnchor>
      </div>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={0}
        className="w-[calc(var(--radix-popover-trigger-width)-1.5rem)] max-w-none rounded-b-none p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          commandRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={() => mentionRef.current?.focus()}
        onInteractOutside={(event) => {
          // The tab toggles; letting dismiss also fire re-opens it on the same
          // click.
          if (
            event.target instanceof Node &&
            tabRef.current?.contains(event.target)
          ) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="button"
          aria-label="Close stash"
          className="flex h-8 w-full items-center gap-2 px-3 text-xs text-muted-foreground hover:text-foreground"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            setOpen(false);
            mentionRef.current?.focus();
          }}
        >
          <IconBookmark aria-hidden className="size-3.5" />
          <span>Stash</span>
          <span className="ml-auto font-medium tabular-nums">
            {entries.length}
          </span>
          <IconChevronDown aria-hidden className="size-3.5" />
        </button>
        <Command
          ref={commandRef}
          shouldFilter={false}
          defaultValue={newestId}
          className="border-0 outline-hidden"
          tabIndex={-1}
        >
          <CommandList className="max-h-72 p-1">
            <CommandEmpty className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing stashed. Press <ShortcutKbd id="stashDraft" /> with a
              draft to stash it.
            </CommandEmpty>
            {entries.map((entry) => (
              <ComposerStashItem
                key={entry._id}
                entry={entry}
                onSelect={() => {
                  void restore(entry).then((ok) => {
                    if (ok) setOpen(false);
                  });
                }}
                onDelete={() => {
                  void removeEntry(entry._id);
                }}
              />
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
