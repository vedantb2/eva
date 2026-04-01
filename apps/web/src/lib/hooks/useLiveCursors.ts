import { useEffect, useCallback, useRef, useMemo } from "react";
import { useMutation } from "convex/react";
import usePresence from "@convex-dev/presence/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";

const THROTTLE_MS = 50;

interface CursorData {
  x: number;
  y: number;
  firstName: string;
  accentColor: string;
}

function isCursorData(data: object): data is CursorData {
  return (
    "x" in data &&
    "y" in data &&
    "firstName" in data &&
    "accentColor" in data &&
    typeof data.x === "number" &&
    typeof data.y === "number" &&
    typeof data.firstName === "string" &&
    typeof data.accentColor === "string"
  );
}

export interface RemoteCursor {
  userId: string;
  x: number;
  y: number;
  firstName: string;
  accentColor: string;
}

export function useLiveCursors(
  roomId: string,
  userId: Id<"users">,
): RemoteCursor[] {
  const presenceState = usePresence(api.presence, roomId, userId);
  const updateCursor = useMutation(api.presence.updateCursor);
  const lastSentRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  const sendUpdate = useCallback(
    (x: number, y: number) => {
      updateCursor({ roomId, x, y }).catch(console.error);
    },
    [updateCursor, roomId],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      const now = Date.now();

      if (now - lastSentRef.current >= THROTTLE_MS) {
        lastSentRef.current = now;
        sendUpdate(x, y);
        pendingRef.current = null;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        pendingRef.current = { x, y };
        if (!timerRef.current) {
          timerRef.current = setTimeout(() => {
            if (pendingRef.current) {
              lastSentRef.current = Date.now();
              sendUpdate(pendingRef.current.x, pendingRef.current.y);
              pendingRef.current = null;
            }
            timerRef.current = null;
          }, THROTTLE_MS);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [sendUpdate]);

  return useMemo(() => {
    if (!presenceState) return [];
    const cursors: RemoteCursor[] = [];
    for (const member of presenceState) {
      if (member.userId === userId) continue;
      if (!member.online) continue;
      const d = member.data;
      if (typeof d !== "object" || d === null) continue;
      if (!isCursorData(d)) continue;
      cursors.push({
        userId: member.userId,
        x: d.x,
        y: d.y,
        firstName: d.firstName,
        accentColor: d.accentColor,
      });
    }
    return cursors;
  }, [presenceState, userId]);
}
