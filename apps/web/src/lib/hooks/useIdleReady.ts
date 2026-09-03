import { useEffect, useState } from "react";

/**
 * Flip to true after the browser is idle (or `timeoutMs`, whichever first).
 * Used to defer preview iframes, analytics and the changelog gate so they
 * do not contend with LCP on the first signed-in paint.
 */
export function useIdleReady(timeoutMs = 2000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setReady(true), {
        timeout: timeoutMs,
      });
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => setReady(true), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [timeoutMs]);

  return ready;
}
