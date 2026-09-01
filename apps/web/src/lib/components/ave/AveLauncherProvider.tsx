"use client";

import { useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AveLauncherContext } from "@/lib/components/ave/aveLauncherContext";
import { AveLauncherSurface } from "@/lib/components/ave/AveLauncherSurface";

/**
 * `closed` has never been opened, so nothing chat-related exists yet;
 * `minimized` is mounted but hidden, which is the whole point — the popover has
 * to survive being dismissed and re-summoned with its conversation intact.
 */
type AvePanelState = "closed" | "open" | "minimized";

interface AveLauncherProviderProps {
  children: ReactNode;
  /**
   * Embedded documents (the inbox preview pane) render content only — the host
   * window already owns the launcher. The context stays mounted regardless so
   * callers never have to know which surface they are on.
   */
  enabled: boolean;
}

/**
 * Mounts Manager Ave's floating launcher once, above the router outlet, so the
 * popover keeps its chat across every route change instead of remounting per
 * page. Lives in `AppShellChrome` for the same reason the sidebar does.
 *
 * The popover chrome is eager so the first click can play its spring. The
 * session tree stays in `AvePanelBody`, loaded on hover/focus or first open.
 */
export function AveLauncherProvider({
  children,
  enabled,
}: AveLauncherProviderProps) {
  const [panel, setPanel] = useState<AvePanelState>("closed");
  // Ave's own page already is the chat, so the launcher would be a second copy
  // of it floating over itself. Hide both, but do not unmount the popover —
  // coming back from `/ave` should find it as it was left.
  const onAveRoute = useRouterState({
    select: (s) =>
      s.location.pathname === "/ave" || s.location.pathname.startsWith("/ave/"),
  });

  const minimize = () =>
    setPanel((prev) => (prev === "closed" ? prev : "minimized"));

  const value = {
    isOpen: panel === "open",
    open: () => setPanel("open"),
    minimize,
  };

  return (
    <AveLauncherContext.Provider value={value}>
      {children}
      {enabled ? (
        <AveLauncherSurface
          isOpen={panel === "open"}
          isMounted={panel !== "closed"}
          isHidden={onAveRoute}
          onOpen={() => setPanel("open")}
          onMinimize={minimize}
        />
      ) : null}
    </AveLauncherContext.Provider>
  );
}
