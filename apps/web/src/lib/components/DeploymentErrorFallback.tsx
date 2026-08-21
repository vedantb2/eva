import { useEffect } from "react";
import { isChunkLoadError } from "@/lib/utils/isChunkLoadError";
import { claimStaleDeployReload } from "@/lib/utils/staleDeployReload";

/**
 * TanStack Router error fallback that silently reloads on stale deployment errors
 * (chunk load failures after a Vercel redeployment) and shows a manual refresh
 * prompt for all other uncaught errors.
 */
export function DeploymentErrorFallback({ error }: { error: Error }) {
  const shouldReload = isChunkLoadError(error) && claimStaleDeployReload();

  useEffect(() => {
    if (shouldReload) {
      window.location.reload();
    }
  }, [shouldReload]);

  if (shouldReload) {
    return <div className="min-h-dvh w-full bg-background" />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background max-sm:px-4">
      <div className="text-center">
        <h1 className="text-balance text-lg font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          Please refresh the page to try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 max-sm:min-h-10 rounded-md bg-primary max-sm:px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
