"use client";

import { useEffect, useRef } from "react";
import { usePromptInputController } from "@conductor/ui";
import type { MentionTextareaHandle } from "@/lib/components/chat/MentionTextarea";

interface ChatTypeToFocusProps {
  /** Ref to the mention editor so a stray keystroke can focus it. */
  mentionRef: React.RefObject<MentionTextareaHandle | null>;
  /** When true, type-to-focus is inert (e.g. sandbox not running). */
  disabled: boolean;
}

/**
 * "Type anywhere to focus" for the chat composer. When the composer is not
 * focused and the user presses a printable key outside any other editable
 * element, seed the composer with that character and focus it — so typing
 * "hello" from a cold view yields "hello" in the input rather than losing the
 * leading characters. Mirrors the type-to-search behaviour in Slack / Linear.
 *
 * Rendered as a child of `PromptInputProvider` (alongside ChatTypingLayer /
 * ChatDraftSync) so it can drive the shared text-input controller. It only
 * mounts when the composer itself is rendered, which naturally excludes the
 * archived / pending-question / draft-loading states.
 */
export function ChatTypeToFocus({
  mentionRef,
  disabled,
}: ChatTypeToFocusProps) {
  const controller = usePromptInputController();

  // Hold the latest input value in a ref so the keydown listener always reads
  // the current text without re-subscribing on every keystroke. While the
  // composer is unfocused its value is effectively static, but a restored draft
  // means it may be non-empty — appending keeps that draft intact.
  const valueRef = useRef(controller.textInput.value);
  const inputValue = controller.textInput.value;
  const setInput = controller.textInput.setInput;

  useEffect(() => {
    valueRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only single printable characters. Modifier combos are shortcuts, and
      // keys like Enter / Tab / Backspace report multi-char `key` values.
      if (event.key.length !== 1) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Mid-IME-composition keystrokes belong to the composition, not us.
      if (event.isComposing) return;
      // Never steal input that is already going somewhere editable — the
      // composer itself, terminals, other inputs, or dialog fields.
      if (isEditableTarget(event.target)) return;

      // Cancel the default insertion (which would land on <body> and be lost),
      // then append the character and focus so subsequent keys flow in order.
      event.preventDefault();
      setInput(valueRef.current + event.key);
      mentionRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [disabled, setInput, mentionRef]);

  return null;
}

/** True when the event originated inside an editable control. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
