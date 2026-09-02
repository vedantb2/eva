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

/**
 * Tooltip for the icon-only sleep/wake controls: names the action, or explains
 * the block while a turn is in flight. Always mounted so the label stays
 * reachable — these buttons carry no visible text.
 */
export function SleepControlTooltip({
  blocked,
  label,
  children,
}: {
  blocked: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">
        {blocked ? MID_TURN_SLEEP_HINT : label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The sleep control shared by the task and project headers. Icon-only: the
 * label lives in the tooltip and `aria-label`, matching the compact control in
 * the sandbox chat header.
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
}: {
  onStop: () => void;
  isStopping: boolean;
  /** True while the assistant holds the chat turn. */
  blockedMidTurn: boolean;
  size?: "sm" | "default";
}) {
  return (
    <SleepControlTooltip blocked={blockedMidTurn} label="Put Eva to sleep">
      <Button
        variant="destructive"
        size={size === "sm" ? "icon-sm" : "icon"}
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
        <IconPlayerStop aria-hidden />
      </Button>
    </SleepControlTooltip>
  );
}
