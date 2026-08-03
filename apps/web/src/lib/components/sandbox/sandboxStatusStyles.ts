/**
 * Shared visual styles for the sandbox status dot — used in both the session
 * sidebar item and the quick-task card. Three states map to a tailwind class
 * for the dot and a human label for the tooltip / `title` attribute.
 */

export type SandboxStatus = "active" | "starting" | "stopping" | "closed";

export const SANDBOX_STATUS_STYLES: Record<
  SandboxStatus,
  { dot: string; label: string }
> = {
  active: {
    dot: "bg-success",
    label: "Running",
  },
  starting: {
    dot: "bg-warning",
    label: "Starting",
  },
  stopping: {
    dot: "bg-warning",
    label: "Stopping",
  },
  closed: {
    dot: "bg-muted-foreground/40",
    label: "Stopped",
  },
};
