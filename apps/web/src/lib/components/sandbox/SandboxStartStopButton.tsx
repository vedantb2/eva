"use client";

import { Button, Spinner } from "@eva/ui";
import { IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react";
import { SandboxPanelToggleButton } from "./SandboxPanelToggleButton";

/** Compact play/stop control used in session, project, and task sandbox chat. */
export function SandboxStartStopButton({
  isActive,
  isToggling,
  onToggle,
}: {
  isActive: boolean;
  isToggling: boolean;
  onToggle: (action: "start" | "stop") => void;
}) {
  return (
    <Button
      size="icon-sm"
      variant={isActive ? "destructive" : "secondary"}
      onClick={() => onToggle(isActive ? "stop" : "start")}
      disabled={isToggling}
      className={isActive ? undefined : "text-success"}
      aria-label={isActive ? "Stop sandbox" : "Start sandbox"}
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
}: {
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  onSandboxToggle?: (action: "start" | "stop") => void;
  sandboxCollapsed?: boolean;
  onToggleSandbox?: () => void;
}) {
  if (!onSandboxToggle && !onToggleSandbox) return null;

  return (
    <div className="flex shrink-0 items-center justify-end gap-1 px-2 py-1">
      {onSandboxToggle ? (
        <SandboxStartStopButton
          isActive={isSandboxActive}
          isToggling={isSandboxToggling}
          onToggle={onSandboxToggle}
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
