import type { StatusTone } from "@eva/ui";

/**
 * Shared visual styles for the sandbox status dot — used in both the session
 * sidebar item and the quick-task card. Four states map to a `StatusDot`
 * tone and a human label for the tooltip / `title` attribute.
 */

export type SandboxStatus = "active" | "starting" | "stopping" | "closed";

export const SANDBOX_STATUS_STYLES: Record<
  SandboxStatus,
  { tone: StatusTone; label: string }
> = {
  active: {
    // "active" exists precisely for this: a live/online/running state, not a
    // workflow stage reached.
    tone: "active",
    label: "Running",
  },
  starting: {
    // No dedicated "warning" tone exists in @eva/ui. "progress" is the
    // workflow ramp's amber/yellow step (bg-status-progress-bar) and the
    // closest existing tone to the old bg-warning — see report for the
    // packages/ui follow-up.
    tone: "progress",
    label: "Starting",
  },
  stopping: {
    tone: "progress",
    label: "Stopping",
  },
  closed: {
    tone: "neutral",
    label: "Stopped",
  },
};
