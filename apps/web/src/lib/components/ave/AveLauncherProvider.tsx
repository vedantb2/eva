"use client";

import { lazy, Suspense, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AveLauncherButton } from "@/lib/components/ave/AveLauncherButton";
import { AveLauncherContext } from "@/lib/components/ave/aveLauncherContext";

/**
 * Lazy so the whole session-detail tree (chat, mentions, markdown) stays out of
 * the app-shell chunk. Nothing Ave-related is fetched until the first open.
 */
const AvePanel = lazy(() =>
  import("@/lib/components/ave/AvePanel").then((m) => ({ default: m.AvePanel })),
);

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
        <>
          {panel === "closed" ? null : (
            <Suspense fallback={null}>
              <AvePanel
                visible={panel === "open" && !onAveRoute}
                onMinimize={minimize}
              />
            </Suspense>
          )}
          {onAveRoute ? null : (
            <AveLauncherButton
              isOpen={panel === "open"}
              onToggle={() => {
                if (panel === "open") minimize();
                else setPanel("open");
              }}
            />
          )}
        </>
      ) : null}
    </AveLauncherContext.Provider>
  );
}
