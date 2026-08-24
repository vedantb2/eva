"use client";

import { Link } from "@tanstack/react-router";
import { m } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { IconArrowsDiagonal, IconMinus } from "@tabler/icons-react";
import { api } from "@eva/backend";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
  motionSpring,
} from "@eva/ui";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { AveBusy, AveHomeRepoPicker } from "@/lib/components/ave/AveHomeRepoPicker";
import { encodeRepoParam } from "@/lib/utils/repoUrl";
import { CachedSessionShell } from "@/routes/_repo/$owner/$repo/sessions/_components/CachedSessionShell";

const HEADER_BUTTON_CLASS =
  "motion-press flex size-7 items-center justify-center rounded-md text-muted-foreground active:scale-[0.9] hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40";

/** The chat itself, once we know whether Ave has a home codebase yet. */
function AvePanelBody() {
  const orchestrator = useQuery(api.sessions.getOrchestratorSession, {});

  // `undefined` is "still loading", not "no session" — rendering the picker
  // here would flash a codebase list at every user who already has one.
  if (orchestrator === undefined) return <AveBusy label="Opening Manager Ave" />;

  if (orchestrator === null) return <AveHomeRepoPicker />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* `isActiveRoute` is false because the popover is never the URL: it is
          what stops this shell's `SimpleViewSandboxRedirect` and legacy-id gate
          from navigating the page out from under whatever route is showing. The
          orchestrator session renders `chatOnly`, which has no sandbox panel and
          so needs nothing the flag turns on. */}
      <CachedSessionShell
        numId={String(orchestrator.numId)}
        owner={orchestrator.owner}
        repoParam={encodeRepoParam(orchestrator.name, orchestrator.rootDirectory)}
        isActiveRoute={false}
        embedded
      />
    </div>
  );
}

/**
 * Manager Ave's chat as a floating popover, anchored above the launcher button.
 *
 * Stays mounted once opened — `visible` only drives opacity/scale and a trailing
 * `visibility: hidden`, never an unmount — so minimizing keeps the conversation,
 * the composer draft and the scroll position exactly where they were.
 *
 * The height is a hard clamp, not a `max-h`: the chat virtualizer measures
 * against its nearest sized ancestor, and an unclamped one makes its measure
 * loop diverge and grow the surface by hundreds of px per second.
 */
export function AvePanel({
  visible,
  onMinimize,
}: {
  visible: boolean;
  onMinimize: () => void;
}) {
  return (
    <m.div
      role="dialog"
      aria-label="Manager Ave"
      aria-hidden={!visible}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={
        visible
          ? { opacity: 1, scale: 1, y: 0, visibility: "visible" }
          : {
              opacity: 0,
              scale: 0.96,
              y: 8,
              transitionEnd: { visibility: "hidden" },
            }
      }
      transition={motionSpring}
      className={cn(
        "fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50",
        "flex h-[min(40rem,calc(100dvh-7rem))] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden",
        "origin-bottom-right rounded-surface bg-popover/95 text-popover-foreground backdrop-blur-md smooth-shadow-ring-xl",
        visible ? null : "pointer-events-none",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <EvaIcon size={18} label={null} disc={false} />
        <span className="flex-1 truncate text-sm font-semibold">
          Manager Ave
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/ave"
              onClick={onMinimize}
              aria-label="Open Manager Ave full screen"
              className={HEADER_BUTTON_CLASS}
            >
              <IconArrowsDiagonal size={16} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open full screen</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize Manager Ave"
              className={HEADER_BUTTON_CLASS}
            >
              <IconMinus size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Minimize</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AvePanelBody />
      </div>
    </m.div>
  );
}
