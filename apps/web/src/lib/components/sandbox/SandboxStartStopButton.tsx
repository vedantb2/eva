"use client";

import { Button, Spinner } from "@eva/ui";
import { IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react";
import { SandboxPanelToggleButton } from "./SandboxPanelToggleButton";

/**
 * Compact play/stop control used in session, project, and task sandbox chat.
 *
 * Hidden — not disabled — while a turn is in flight. Stopping the VM mid-turn
 * does not cancel the turn: the daemon dies with the VM, the workflow keeps
 * waiting, and the chat sits on "Working…" until the stall watchdog kills it
 * 5–25 minutes later with an alert that blames a runtime limit. The composer's
 * "Stop Eva" button is present in exactly this state and cancels properly, so
 * this is the wrong of two adjacent controls and removing it costs the user
 * nothing. A `disabled` button would keep drawing the eye to the wrong one.
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
  /** Suppresses the stop affordance while the assistant holds the turn. */
  isAssistantResponding?: boolean;
}) {
  // Only stopping is unsafe mid-turn; a turn cannot be running on a sandbox
  // that is asleep, but if the flags ever disagree, starting stays available.
  if (isActive && isAssistantResponding) return null;

  return (
    <Button
      size="icon-sm"
      variant={isActive ? "destructive" : "secondary"}
      onClick={() => onToggle(isActive ? "stop" : "start")}
      disabled={isToggling}
      className={isActive ? undefined : "text-success"}
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
