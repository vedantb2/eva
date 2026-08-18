"use client";

import type { ReactNode } from "react";
import {
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@eva/ui";
import { IconPlayerStop } from "@tabler/icons-react";

/**
 * Putting the sandbox to sleep mid-turn does not cancel the turn: the daemon
 * dies with the VM, the workflow keeps waiting, and the chat sits on "Working…"
 * until the stall watchdog kills it 5–25 minutes later with an alert that blames
 * a runtime limit rather than the button that was pressed. The composer's "Stop
 * Eva" is present in exactly that window and cancels properly.
 *
 * The control used to be removed outright in that state, which read as a bug —
 * the header lost a button mid-turn and grew it back. It now stays put, inert,
 * and says why.
 */
export const MID_TURN_SLEEP_HINT =
  "Eva is working — use Stop Eva in the composer first";

/** Wraps a blocked sleep control so hovering it explains the block. */
export function MidTurnSleepTooltip({
  blocked,
  children,
}: {
  blocked: boolean;
  children: ReactNode;
}) {
  if (!blocked) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{MID_TURN_SLEEP_HINT}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The labelled "Put Eva to sleep" button shared by the task and project headers.
 *
 * `aria-disabled` rather than `disabled` while blocked: a disabled button
 * swallows pointer events, so the tooltip carrying the explanation would never
 * open. The click handler returns early in the same state, so it is inert either
 * way.
 */
export function SleepEvaButton({
  onStop,
  isStopping,
  blockedMidTurn,
  size = "default",
  iconSize = 18,
}: {
  onStop: () => void;
  isStopping: boolean;
  /** True while the assistant holds the chat turn. */
  blockedMidTurn: boolean;
  size?: "sm" | "default";
  iconSize?: number;
}) {
  return (
    <MidTurnSleepTooltip blocked={blockedMidTurn}>
      <Button
        variant="destructive"
        size={size}
        aria-label="Put Eva to sleep"
        onClick={() => {
          if (blockedMidTurn) return;
          onStop();
        }}
        disabled={isStopping}
        aria-disabled={blockedMidTurn || undefined}
        className={cn(
          blockedMidTurn &&
            "cursor-not-allowed opacity-45 hover:bg-destructive",
        )}
      >
        <IconPlayerStop size={iconSize} aria-hidden />
        <span className="hidden sm:inline">Put Eva to sleep</span>
      </Button>
    </MidTurnSleepTooltip>
  );
}
