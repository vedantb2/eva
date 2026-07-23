import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query without setState-in-effect.
 * `useSyncExternalStore` is the React 18+ recommended pattern for browser APIs.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
