"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@eva/ui";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { QueryErrorBoundary } from "@/lib/components/QueryErrorBoundary";

/**
 * A dot, not a count: there is only ever one Manager Ave, so the question is
 * "is its sandbox up", not "how many". Same semantics the rail tile used before
 * the launcher took the query over.
 */
function AveActiveDot() {
  const orchestrator = useQuery(api.sessions.getOrchestratorSession, {});
  if (orchestrator?.status !== "active") return null;
  return (
    <>
      <span
        className="absolute right-0.5 top-0.5 size-2.5 rounded-full bg-success ring-2 ring-popover"
        aria-hidden
      />
      <span className="sr-only">Sandbox active</span>
    </>
  );
}

/**
 * The floating summon button, bottom-right of the signed-in shell. Circular and
 * carrying Eva's own mark rather than a generic glyph: Ave is the one agent that
 * is Eva herself rather than a piece of work.
 */
export function AveLauncherButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Manager Ave"
          aria-expanded={isOpen}
          className={cn(
            "motion-press fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50",
            "flex size-12 items-center justify-center rounded-full",
            "bg-popover/95 text-popover-foreground backdrop-blur-md smooth-shadow-ring-lg",
            "hover:scale-[1.03] active:scale-[0.94]",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        >
          <EvaIcon size={24} label={null} disc={false} />
          <QueryErrorBoundary>
            <AveActiveDot />
          </QueryErrorBoundary>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">Manager Ave</TooltipContent>
    </Tooltip>
  );
}
