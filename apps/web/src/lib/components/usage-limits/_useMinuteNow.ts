"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function minuteSnapshot(): number {
  return Math.floor(Date.now() / MINUTE_MS);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === undefined) {
    timer = setInterval(() => {
      for (const notify of listeners) notify();
    }, MINUTE_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** A shared minute clock for expiry UI, without component-owned timer state. */
export function useMinuteNow(): number {
  const minute = useSyncExternalStore(
    subscribe,
    minuteSnapshot,
    minuteSnapshot,
  );
  return minute * MINUTE_MS;
}
