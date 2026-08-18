"use client";

import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@eva/backend";
import {
  EMPTY_SHORTCUT_OVERRIDES,
  ShortcutsStateContext,
} from "@/lib/hotkeys/useShortcut";

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
    <ShortcutsStateContext.Provider
      value={{ overrides: overrides ?? EMPTY_SHORTCUT_OVERRIDES }}
    >
      {children}
    </ShortcutsStateContext.Provider>
  );
}
