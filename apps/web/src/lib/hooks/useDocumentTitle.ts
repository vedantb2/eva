import { useEffect } from "react";
import { useMatches } from "@tanstack/react-router";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Section label for the browser tab, e.g. `"Projects"` → "Projects | Eva". */
    title?: string;
  }
}

/** Shown on routes that declare no title (landing page, auth callbacks). */
const FALLBACK_TITLE = "Eva - Your New Coworker";

/**
 * Keeps the browser tab title in sync with the active route.
 *
 * Routes declare their label via `staticData: { title: "Projects" }`. The
 * deepest match with a title wins, so a nested route can override the label it
 * would otherwise inherit from its parent layout. Called once from the root
 * route so every navigation — including ones that never unmount the shell —
 * updates the tab.
 */
export function useDocumentTitle() {
  const title = useMatches({
    select: (matches) =>
      matches.reduce<string | null>(
        (deepest, match) => match.staticData.title ?? deepest,
        null,
      ),
  });

  useEffect(() => {
    document.title = title ? `${title} | Eva` : FALLBACK_TITLE;
  }, [title]);
}
