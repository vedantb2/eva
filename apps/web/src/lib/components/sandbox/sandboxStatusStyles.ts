/**
 * Shared visual styles for the sandbox status dot — used by the session sidebar
 * item, list/kanban cards, and the Task/Project surface tabs. Each state maps
 * to a tailwind class for the dot and a human label for the tooltip / `title`.
 */

export type SandboxStatus = "active" | "starting" | "stopping" | "closed";

export const SANDBOX_STATUS_STYLES: Record<
  SandboxStatus,
  { dot: string; label: string }
> = {
  active: {
    dot: "bg-emerald-500",
    label: "Running",
  },
  starting: {
    dot: "bg-amber-400",
    label: "Starting",
  },
  stopping: {
    dot: "bg-amber-400",
    label: "Stopping",
  },
  closed: {
    dot: "bg-muted-foreground/40",
    label: "Stopped",
  },
};
