import { createBrowserHistory } from "@tanstack/react-router";

/** Default browser history — monorepo slash↔dash lives in the router rewrite. */
export function createAppHistory() {
  return createBrowserHistory();
}
