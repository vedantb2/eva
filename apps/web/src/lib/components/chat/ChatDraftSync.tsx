import { useEffect, useRef } from "react";
import { usePromptInputController } from "@conductor/ui";
import { useDraftAutosave } from "@/lib/hooks/useDraftAutosave";
import type { MentionTextareaHandle } from "@/lib/components/chat/MentionTextarea";
import type { ChatDraftTarget } from "./useChatDraftSeed";

interface ChatDraftSyncProps {
  target: ChatDraftTarget;
  mentionRef: React.RefObject<MentionTextareaHandle | null>;
  /** The display text that seeded the editor at mount — used to skip the
   * redundant initial save when the value equals the already-persisted draft. */
  initialDisplay: string;
}

/**
 * Invisible component rendered inside PromptInputProvider.
 * Watches textInput.value and saves the tokenized draft on every change,
 * coalesced via useSingleFlight so rapid keystrokes don't stampede the backend.
 *
 * Empty content → the mutation deletes the row (handles both clear-on-send and
 * the user manually clearing the input).
 *
 * The initial save is skipped when the value equals the seeded display text to
 * avoid a redundant write on mount.
 */
export function ChatDraftSync({
  target,
  mentionRef,
  initialDisplay,
}: ChatDraftSyncProps) {
  const { textInput } = usePromptInputController();
  const { save } = useDraftAutosave(target, mentionRef);

  // Track whether this is the very first render so we can skip the redundant
  // initial save when the input value matches what we seeded from the draft.
  const isMountedRef = useRef(false);

  useEffect(() => {
    // On the first run the value will equal initialDisplay (seeded from the
    // persisted draft). Saving it back is a no-op on the server, but it wastes
    // a round-trip on every session mount. Skip it.
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      if (textInput.value === initialDisplay) {
        return;
      }
    }

    // Tokenize + persist via the shared autosave; an empty value deletes the
    // row server-side (handles clear-on-send and manual clearing alike).
    save(textInput.value);
  }, [textInput.value]); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally omitting target/mentionRef/save/initialDisplay from
  // the dep array: target is stable (keyed to session id), mentionRef is a ref,
  // save identity changes are inconsequential for an autosave effect, and
  // initialDisplay is only needed for the mount-skip guard which uses a ref.

  return null;
}
