"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@eva/ui";
import { IconX } from "@tabler/icons-react";
import { AveMark } from "@/lib/components/ave/AveMark";
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
        className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-success ring-2 ring-background"
        aria-hidden
      />
      <span className="sr-only">Sandbox active</span>
    </>
  );
}

const GLYPH_LAYER =
  "pointer-events-none absolute inset-0 flex items-center justify-center transition-[opacity,scale] duration-[var(--motion-fast)] ease-[var(--motion-ease-out)]";

/**
 * The floating summon button, bottom-right of the signed-in shell. Closed, it
 * *is* Eva's mark — Ave is Eva herself, so the launcher is the app icon, not a
 * toolbar glyph on glass. Open, the same circle becomes the close control.
 */
export function AveLauncherButton({
  isOpen,
  onToggle,
  onIntent,
}: {
  isOpen: boolean;
  onToggle: () => void;
  /** Hover/focus — start the chat chunk before the first click. */
  onIntent?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          onMouseEnter={onIntent}
          onFocus={onIntent}
          aria-label={isOpen ? "Close Manager Ave" : "Manager Ave"}
          aria-expanded={isOpen}
          className={cn(
            "motion-press fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50",
            "flex size-12 items-center justify-center rounded-full",
            "smooth-shadow-ring-lg hover:scale-[1.03] active:scale-[0.94]",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40",
            // AveMark clips the star. The sandbox pip hangs off the corner
            // like a rail tile, so this circle must not clip descendants.
            isOpen
              ? "bg-popover/95 text-popover-foreground backdrop-blur-md"
              : "bg-transparent",
          )}
        >
          {/* Open → a close affordance: the mark says "summon Ave", but once the
              panel is up the same button dismisses it, and an unchanged glyph
              reads as "open it again". Both glyphs stay mounted so the swap
              can crossfade instead of teleporting. The dot rides the Eva layer
              so it leaves with the mark. */}
          <span className="relative size-full">
            <span
              className={cn(
                GLYPH_LAYER,
                isOpen ? "scale-90 opacity-0" : "scale-100 opacity-100",
              )}
              aria-hidden={isOpen}
            >
              <AveMark className="size-full" />
              <QueryErrorBoundary>
                <AveActiveDot />
              </QueryErrorBoundary>
            </span>
            <span
              className={cn(
                GLYPH_LAYER,
                isOpen ? "scale-100 opacity-100" : "scale-90 opacity-0",
              )}
              aria-hidden={!isOpen}
            >
              <IconX size={22} className="shrink-0" />
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">
        {isOpen ? "Close" : "Manager Ave"}
      </TooltipContent>
    </Tooltip>
  );
}
