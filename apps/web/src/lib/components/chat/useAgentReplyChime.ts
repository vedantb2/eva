import { useEffect, useRef } from "react";
import { playNotificationChime } from "@/lib/utils/notificationChime";

/**
 * Plays the inbox notification chime once when the agent finishes a turn.
 *
 * Lives in ChatBody so every chat surface (session, quick task, project) gets
 * it from one place, and keys off `isExecuting` — the same flag the composer
 * uses to decide between send and enqueue — so "finished" here means exactly
 * what it means everywhere else in the chat.
 *
 * Audio only, and only locally: a session can be watched by several people, so
 * `isOwnTurn` keeps the chime with the person who prompted the turn rather than
 * sounding on every teammate's machine.
 */
export function useAgentReplyChime({
  conversationId,
  isExecuting,
  isOwnTurn,
}: {
  conversationId: string;
  isExecuting: boolean;
  isOwnTurn: boolean;
}): void {
  const watchedRef = useRef<{
    conversationId: string;
    wasExecuting: boolean;
  } | null>(null);

  useEffect(() => {
    const watched = watchedRef.current;
    watchedRef.current = { conversationId, wasExecuting: isExecuting };

    // First observation of this chat — opening a settled conversation must not
    // chime for a turn that finished before the panel mounted.
    if (!watched || watched.conversationId !== conversationId) {
      return;
    }
    // Only the executing → idle edge; steady state on either side is silent.
    if (!watched.wasExecuting || isExecuting) {
      return;
    }
    if (!isOwnTurn) {
      return;
    }
    playNotificationChime();
  }, [conversationId, isExecuting, isOwnTurn]);
}
