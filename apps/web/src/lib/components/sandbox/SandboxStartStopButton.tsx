"use client";

import { Button, cn, Spinner } from "@eva/ui";
import { IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react";
import { SandboxPanelToggleButton } from "./SandboxPanelToggleButton";
import { MidTurnSleepTooltip } from "./SleepEvaButton";

/**
 * Compact play/stop control used in session, project, and task sandbox chat.
 *
 * Held open but inert while a turn is in flight, with a tooltip saying why —
 * see {@link MidTurnSleepTooltip} for the reasoning and for the `aria-disabled`
 * treatment this shares with the labelled sleep button.
 */
export function SandboxStartStopButton({
  isActive,
  isToggling,
  onToggle,
  isAssistantResponding = false,
}: {
  isActive: boolean;
  isToggling: boolean;
  onToggle: (action: "start" | "stop") => void;
  /** Makes the stop affordance inert while the assistant holds the turn. */
  isAssistantResponding?: boolean;
}) {
  // Only stopping is unsafe mid-turn; a turn cannot be running on a sandbox
  // that is asleep, but if the flags ever disagree, starting stays available.
  const blockedMidTurn = isActive && isAssistantResponding;

  return (
    <MidTurnSleepTooltip blocked={blockedMidTurn}>
      <Button
        size="icon-sm"
        variant={isActive ? "destructive" : "secondary"}
        onClick={() => {
          if (blockedMidTurn) return;
          onToggle(isActive ? "stop" : "start");
        }}
        disabled={isToggling}
        aria-disabled={blockedMidTurn || undefined}
        className={cn(
          isActive ? undefined : "text-success",
          blockedMidTurn && "cursor-not-allowed opacity-45 hover:bg-destructive",
        )}
        aria-label={isActive ? "Put Eva to sleep" : "Wake up Eva"}
      >
        {isToggling ? (
          <Spinner size="sm" />
        ) : isActive ? (
          <IconPlayerStop className="w-4 h-4" />
        ) : (
          <IconPlayerPlay className="w-4 h-4" />
        )}
      </Button>
    </MidTurnSleepTooltip>
  );
}

/** Start/stop plus panel toggle for project and task sandbox chat headers. */
export function SandboxChatHeaderActions({
  isSandboxActive,
  isSandboxToggling,
  onSandboxToggle,
  sandboxCollapsed,
  onToggleSandbox,
  isAssistantResponding = false,
}: {
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  onSandboxToggle?: (action: "start" | "stop") => void;
  sandboxCollapsed?: boolean;
  onToggleSandbox?: () => void;
  isAssistantResponding?: boolean;
}) {
  if (!onSandboxToggle && !onToggleSandbox) return null;

  return (
    <div className="flex shrink-0 items-center justify-end gap-1 px-2 py-1">
      {onSandboxToggle ? (
        <SandboxStartStopButton
          isActive={isSandboxActive}
          isToggling={isSandboxToggling}
          onToggle={onSandboxToggle}
          isAssistantResponding={isAssistantResponding}
        />
      ) : null}
      {onToggleSandbox ? (
        <SandboxPanelToggleButton
          collapsed={sandboxCollapsed === true}
          onToggle={onToggleSandbox}
        />
      ) : null}
    </div>
  );
}
