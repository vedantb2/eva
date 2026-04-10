import { useEffect } from "react";
import { isChunkLoadError } from "@/lib/utils/isChunkLoadError";

const RELOAD_COOLDOWN_KEY = "deployment-reload-ts";
const RELOAD_COOLDOWN_MS = 10_000;

/** Prevents infinite reload loops by enforcing a cooldown between auto-reloads. */
function canAutoReload(): boolean {
  try {
    const last = sessionStorage.getItem(RELOAD_COOLDOWN_KEY);
    if (last && Date.now() - Number(last) < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_COOLDOWN_KEY, String(Date.now()));
    return true;
  } catch {
    // sessionStorage unavailable (e.g. private browsing), allow reload
    return true;
  }
}

/**
 * TanStack Router error fallback that silently reloads on stale deployment errors
 * (chunk load failures after a Vercel redeployment) and shows a manual refresh
 * prompt for all other uncaught errors.
 */
export function DeploymentErrorFallback({ error }: { error: Error }) {
  const shouldReload = isChunkLoadError(error) && canAutoReload();

  useEffect(() => {
    if (shouldReload) {
      window.location.reload();
    }
  }, [shouldReload]);

  if (shouldReload) {
    return <div className="min-h-screen w-full bg-background" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please refresh the page to try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
