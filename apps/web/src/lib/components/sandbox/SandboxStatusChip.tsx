import { cn } from "@eva/ui";
import {
  SANDBOX_STATUS_STYLES,
  type SandboxStatus,
} from "./sandboxStatusStyles";

/**
 * Sandbox state at the trailing edge of the sandbox tab bar. Until now the only
 * running/stopped signal sat in the sidebar and on the list cards, so a user
 * looking at an empty Preview had nothing nearby telling them the VM was down.
 * Tone-only (no border) so it reads as a label, not a control.
 */
export function SandboxStatusChip({ status }: { status: SandboxStatus }) {
  const { dot, label } = SANDBOX_STATUS_STYLES[status];
  const settling = status === "starting" || status === "stopping";
  return (
    <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground">
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          dot,
          settling && "animate-pulse",
        )}
      />
      {label}
    </span>
  );
}
