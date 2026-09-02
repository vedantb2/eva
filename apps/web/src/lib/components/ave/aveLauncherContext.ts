import { createContext, useContext } from "react";

export interface AveLauncherContextValue {
  /** True while the popover is on screen (not minimized, not closed). */
  isOpen: boolean;
  /** Show the popover. Mounts Ave's chat on the first call and never again. */
  open: () => void;
  /** Hide the popover but keep it mounted, so the conversation survives. */
  minimize: () => void;
}

const fallback: AveLauncherContextValue = {
  isOpen: false,
  open: () => {},
  minimize: () => {},
};

export const AveLauncherContext =
  createContext<AveLauncherContextValue | null>(null);

/**
 * Summon Manager Ave from anywhere in the signed-in shell. Falls back to no-ops
 * where the launcher is not mounted (embedded documents, the landing page), so
 * a caller never has to know which surface it is on.
 */
export function useAveLauncher(): AveLauncherContextValue {
  return useContext(AveLauncherContext) ?? fallback;
}
