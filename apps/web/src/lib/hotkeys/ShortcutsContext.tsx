"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@eva/backend";
import {
  useHotkey,
  type Hotkey,
  type HotkeyCallback,
  type UseHotkeyOptions,
} from "@tanstack/react-hotkeys";
import { resolveBinding, type ShortcutId } from "@/lib/hotkeys/registry";

interface ShortcutsContextValue {
  /** Sparse map of shortcut id to hotkey. Empty until the query resolves. */
  overrides: Record<string, string>;
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

const EMPTY_OVERRIDES: Record<string, string> = {};

/**
 * Serves each user's rebound shortcuts to `useShortcut` and the `Kbd` hints.
 *
 * While the query is in flight the map is empty, so every shortcut resolves to
 * its default and keeps working during first paint; custom bindings swap in
 * once the data arrives.
 */
export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const overrides = useQuery(api.auth.getShortcutOverrides);

  return (
    <ShortcutsContext.Provider value={{ overrides: overrides ?? EMPTY_OVERRIDES }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

/**
 * Overrides for callers outside the provider (tests, isolated stories) so they
 * fall back to defaults instead of throwing.
 */
function useOverrides(): Record<string, string> {
  const ctx = useContext(ShortcutsContext);
  return ctx?.overrides ?? EMPTY_OVERRIDES;
}

/** The combo currently bound to a shortcut, for display in a `Kbd`. */
export function useShortcutBinding(id: ShortcutId): Hotkey {
  return resolveBinding(id, useOverrides());
}

/**
 * Registers a shortcut by id rather than by literal combo, so the user's
 * binding from settings → Shortcuts takes effect. Drop-in replacement for
 * `useHotkey`; `options.enabled` and `options.target` behave the same.
 */
export function useShortcut(
  id: ShortcutId,
  callback: HotkeyCallback,
  options?: UseHotkeyOptions,
) {
  useHotkey(useShortcutBinding(id), callback, options);
}
