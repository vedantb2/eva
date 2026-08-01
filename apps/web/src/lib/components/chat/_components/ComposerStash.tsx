import { useEffect, useRef, useState, type RefObject } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { m } from "motion/react";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
  Popover,
  PopoverAnchor,
  PopoverContent,
  usePromptInputController,
} from "@eva/ui";
import { IconBookmark, IconX } from "@tabler/icons-react";
import type { Id } from "@eva/backend";
import { relativeTime } from "@/lib/components/artifacts/_format";
import {
  isImageContentType,
  type ChatAttachmentMode,
} from "@/lib/components/attachments/attachmentMeta";
import { tokenizedToEditable } from "@/lib/components/mentions";
import type { MentionTextareaHandle } from "@/lib/components/chat/MentionTextarea";
import {
  useComposerStash,
  type PromptStashEntry,
} from "@/lib/components/chat/_components/useComposerStash";

function previewSnippet(tokenized: string, maxLength = 90): string {
  const { displayText } = tokenizedToEditable(tokenized);
  const singleLine = displayText.replace(/\s+/g, " ").trim();
  if (singleLine.length === 0) return "(attachments only)";
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength - 1)}…`;
}

function ComposerStashItem({
  entry,
  onSelect,
  onDelete,
}: {
  entry: PromptStashEntry;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <CommandItem
      value={entry._id}
      onSelect={onSelect}
      className="group flex cursor-pointer items-start gap-2 aria-selected:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          {previewSnippet(entry.content)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {entry.attachments.length > 0 ? (
            <div className="flex items-center gap-1">
              {entry.attachments.slice(0, 3).map((attachment) =>
                isImageContentType(attachment.contentType) ? (
                  <img
                    key={attachment.url}
                    src={attachment.url}
                    alt=""
                    className="size-8 rounded-surface border border-border object-cover"
                  />
                ) : (
                  <span
                    key={attachment.url}
                    className="flex size-8 items-center justify-center rounded-surface border border-border bg-muted text-3xs text-muted-foreground"
                  >
                    file
                  </span>
                ),
              )}
            </div>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {relativeTime(entry._creationTime)}
          </span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Delete stash"
        className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <IconX className="size-3.5" />
      </button>
    </CommandItem>
  );
}

/**
 * Footer pill + ⌘S stash/restore for the shared chat composer.
 * Hotkey is gated on composer focus (or open picker) so it does not steal
 * browser save from other fields on the page.
 */
export function ComposerStash({
  repoId,
  mentionRef,
  attachmentMode,
  disabled,
}: {
  repoId: Id<"githubRepos">;
  mentionRef: RefObject<MentionTextareaHandle | null>;
  attachmentMode: ChatAttachmentMode;
  disabled: boolean;
}) {
  const { textInput, attachments } = usePromptInputController();
  const { entries, stash, restore, removeEntry } = useComposerStash({
    repoId,
    mentionRef,
    attachmentMode,
  });

  const [open, setOpen] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = anchorRef.current?.closest("form");
    if (!form) return;

    const onFocusIn = () => {
      setComposerFocused(true);
    };
    const onFocusOut = () => {
      requestAnimationFrame(() => {
        if (open) return;
        if (form.contains(document.activeElement)) {
          setComposerFocused(true);
          return;
        }
        setComposerFocused(false);
      });
    };

    form.addEventListener("focusin", onFocusIn);
    form.addEventListener("focusout", onFocusOut);
    return () => {
      form.removeEventListener("focusin", onFocusIn);
      form.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  const hotkeyEnabled = !disabled && (composerFocused || open);

  useHotkey(
    "Mod+S",
    (event) => {
      event.preventDefault();
      if (disabled) return;

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
    { enabled: hotkeyEnabled, requireReset: true },
  );

  const newestId = entries[0]?._id;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <span
          ref={anchorRef}
          className={
            entries.length > 0
              ? "inline-flex"
              : "inline-flex size-0 overflow-hidden"
          }
        >
          {entries.length > 0 ? (
            <m.button
              key={pulseKey}
              type="button"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-muted px-2 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              onClick={() => setOpen((prev) => !prev)}
              title="Prompt stash"
              aria-label={`Prompt stash, ${entries.length} saved`}
            >
              <IconBookmark className="size-3.5" />
              <span>{entries.length}</span>
            </m.button>
          ) : null}
        </span>
      </PopoverAnchor>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          commandRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <Command
          ref={commandRef}
          shouldFilter={false}
          defaultValue={newestId}
          className="border-0 outline-none"
          tabIndex={-1}
        >
          <CommandList className="max-h-72 p-1">
            <CommandEmpty className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing stashed. Press ⌘S with a draft to stash it.
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
