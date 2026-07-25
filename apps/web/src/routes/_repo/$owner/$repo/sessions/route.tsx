import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { cn } from "@eva/ui";
import { CachedSessionShell } from "./_components/CachedSessionShell";

/** Cap mounted session shells so Preview iframes / PTYs stay bounded. */
const MAX_CACHED_SESSIONS = 3;

/**
 * Sessions section layout. Keeps the last few opened session shells mounted
 * (hidden) so switching sidebar sessions does not remount Preview iframes.
 * `/sessions` (no `$numId`) still renders the new-session composer via Outlet.
 */
export const Route = createFileRoute("/_repo/$owner/$repo/sessions")({
  component: SessionsLayout,
});

function SessionsLayout() {
  const params = useParams({ strict: false });
  const activeNumId =
    typeof params.numId === "string" && params.numId.length > 0
      ? params.numId
      : undefined;

  const [cachedNumIds, setCachedNumIds] = useState<ReadonlyArray<string>>(() =>
    activeNumId !== undefined ? [activeNumId] : [],
  );

  useEffect(() => {
    if (activeNumId === undefined) return;
    setCachedNumIds((prev) => {
      if (prev[0] === activeNumId) return prev;
      const rest = prev.filter((id) => id !== activeNumId);
      return [activeNumId, ...rest].slice(0, MAX_CACHED_SESSIONS);
    });
  }, [activeNumId]);

  return (
    <div className="h-full min-h-0">
      <div className={activeNumId === undefined ? "h-full min-h-0" : "hidden"}>
        <Outlet />
      </div>
      {cachedNumIds.map((numId) => {
        const isActive = numId === activeNumId;
        return (
          <div
            key={numId}
            className={cn("h-full min-h-0", !isActive && "hidden")}
            // Keep inactive shells out of the a11y tree while mounted.
            aria-hidden={!isActive}
          >
            <CachedSessionShell numId={numId} isActiveRoute={isActive} />
          </div>
        );
      })}
    </div>
  );
}
