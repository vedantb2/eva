import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation } from "convex/react";
import usePresence from "@convex-dev/presence/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

// How long after the last keystroke we consider the user to have stopped
// typing. Resets on every keystroke, so it acts as a trailing-edge debounce
// for the "stopped typing" broadcast.
const TYPING_TIMEOUT_MS = 3000;

// Shape of the per-user data we attach to the presence room. Mirrors the
// cursor data channel in useLiveCursors — the presence component lets each
// member carry an arbitrary `data` object.
interface TypingData {
  isTyping: boolean;
  firstName: string;
}

function isTypingData(data: object): data is TypingData {
  return (
    "isTyping" in data &&
    "firstName" in data &&
    typeof data.isTyping === "boolean" &&
    typeof data.firstName === "string"
  );
}

export interface TypingUser {
  userId: string;
  firstName: string;
}

export interface TypingPresence {
  /** Other teammates currently typing in this room (never includes self). */
  typingUsers: TypingUser[];
  /** Call on each keystroke. Broadcasts "typing" on the rising edge only. */
  onActivity: () => void;
  /** Broadcasts "stopped typing" immediately (e.g. on submit/unmount). */
  stopTyping: () => void;
}

/**
 * Broadcasts and observes ephemeral "is typing" presence for a conversation,
 * built on the @convex-dev/presence component (same mechanism as live
 * cursors). State lives only in presence, so it auto-clears when a user goes
 * offline — no DB table or cleanup job.
 *
 * `userId` may be undefined while the current-user query resolves; activity is
 * a no-op until it is known.
 */
export function useTypingPresence(
  roomId: string,
  userId: Id<"users"> | undefined,
): TypingPresence {
  // Mounting usePresence keeps the user *present* in the room (online), which
  // is distinct from *typing*; the indicator filters on data.isTyping.
  const presenceState = usePresence(api.presence, roomId, userId ?? "");
  const updateTyping = useMutation(api.presence.updateTyping);
  const isTypingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      updateTyping({ roomId, isTyping: false }).catch(console.error);
    }
  }, [updateTyping, roomId]);

  const onActivity = useCallback(() => {
    if (!userId) return;
    // Send "typing: true" only on the rising edge — while the user keeps
    // typing, no further mutations are sent.
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      updateTyping({ roomId, isTyping: true }).catch(console.error);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(stopTyping, TYPING_TIMEOUT_MS);
  }, [updateTyping, roomId, stopTyping, userId]);

  // Clear the flag when leaving the conversation (unmount or room change).
  useEffect(() => stopTyping, [stopTyping]);

  const typingUsers = useMemo(() => {
    if (!presenceState) return [];
    const users: TypingUser[] = [];
    for (const member of presenceState) {
      if (member.userId === userId) continue;
      if (!member.online) continue;
      const data = member.data;
      if (typeof data !== "object" || data === null) continue;
      if (!isTypingData(data)) continue;
      if (!data.isTyping) continue;
      users.push({ userId: member.userId, firstName: data.firstName });
    }
    return users;
  }, [presenceState, userId]);

  return { typingUsers, onActivity, stopTyping };
}
