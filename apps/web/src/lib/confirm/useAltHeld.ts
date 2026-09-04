import { useSyncExternalStore } from "react";

/**
 * Whether Alt (Option on macOS) is held right now.
 *
 * Subscribes to the window so every confirmable control can restyle when the
 * modifier goes down, and so Alt+click still works when the activating event
 * is a Radix `onSelect` that does not carry `altKey`.
 *
 * Cleared on blur / visibility hide so a missed keyup after alt-tab cannot
 * leave the app stuck in skip-confirm mode.
 */

let altHeld = false;
const listeners = new Set<() => void>();
let attached = false;

function notify(): void {
  for (const listener of listeners) listener();
}

function setHeld(next: boolean): void {
  if (altHeld === next) return;
  altHeld = next;
  notify();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "Alt" || event.altKey) setHeld(true);
}

function onKeyUp(event: KeyboardEvent): void {
  if (event.key === "Alt" || !event.altKey) setHeld(false);
}

function clear(): void {
  setHeld(false);
}

function onVisibilityChange(): void {
  if (document.hidden) clear();
}

function attach(): void {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", onVisibilityChange);
}

function detach(): void {
  if (!attached) return;
  attached = false;
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  window.removeEventListener("blur", clear);
  document.removeEventListener("visibilitychange", onVisibilityChange);
}

function subscribe(onStoreChange: () => void): () => void {
  attach();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) detach();
  };
}

export function useAltHeld(): boolean {
  return useSyncExternalStore(subscribe, () => altHeld, () => false);
}
