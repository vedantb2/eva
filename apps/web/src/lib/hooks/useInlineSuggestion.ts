import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";

/** Trailing-edge debounce: how long the user must pause before we ask the model. */
const IDLE_MS = 500;

/** Below this, there is not enough signal to continue anything usefully. */
const MIN_CHARS = 12;

export interface InlineSuggestion {
  /** Ghost text to render after the caret, or undefined when there is none. */
  suggestion: string | undefined;
  /** Suppress the current suggestion until the text changes again. */
  dismiss: () => void;
}

/**
 * True when we should not ask for a completion for this text at all.
 *
 * Skips in-progress `@mention` / `/skill` triggers so the completion never
 * competes with the mention picker, and skips text that already ends a sentence
 * (there is nothing to finish).
 */
function shouldSkip(value: string): boolean {
  if (value.trim().length < MIN_CHARS) return true;
  const lastWord = value.split(/\s/).pop() ?? "";
  if (lastWord.startsWith("@") || lastWord.startsWith("/")) return true;
  if (/[.!?]\s*$/.test(value)) return true;
  return false;
}

/**
 * Inline AI completion for a prose field: after a typing pause, asks the gateway
 * to finish the current sentence and returns it as ghost text for the caller to
 * render. The caller owns accepting it (append `suggestion` to its own value).
 *
 * Pass `contextHint` describing what the field is for — it doubles as the
 * on/off switch, so a field that omits it gets no completions at all.
 *
 * Staleness needs no abort tokens: a result is only surfaced while the value it
 * was requested for still matches the current value, so a slow response for an
 * older draft is simply never shown, and accepting one hides it by changing the
 * value.
 */
export function useInlineSuggestion(
  value: string,
  contextHint: string | undefined,
): InlineSuggestion {
  const completeText = useAction(api.textGen.completeText);
  const [result, setResult] = useState<{
    forValue: string;
    text: string;
  } | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  const skip = contextHint === undefined || shouldSkip(value);
  const alreadyHave = result?.forValue === value;
  const dismissed = dismissedFor === value;

  useEffect(() => {
    if (skip || alreadyHave || dismissed || contextHint === undefined) return;
    const timer = setTimeout(() => {
      completeText({ text: value, contextHint })
        .then((text) => {
          if (text) setResult({ forValue: value, text });
        })
        .catch(console.error);
    }, IDLE_MS);
    return () => clearTimeout(timer);
  }, [value, contextHint, skip, alreadyHave, dismissed, completeText]);

  const suggestion =
    !skip && !dismissed && result?.forValue === value
      ? // The model returns a bare continuation; add the joining space here so
        // the ghost text lines up with what accepting it will produce.
        /\s$/.test(value) || /^\s/.test(result.text)
        ? result.text
        : ` ${result.text}`
      : undefined;

  return { suggestion, dismiss: () => setDismissedFor(value) };
}
