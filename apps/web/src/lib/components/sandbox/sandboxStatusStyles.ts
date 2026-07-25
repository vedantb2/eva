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
    dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
    label: "Sandbox active",
  },
  starting: {
    dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]",
    label: "Sandbox starting",
  },
  stopping: {
    dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]",
    label: "Sandbox stopping",
  },
  closed: {
    dot: "bg-muted-foreground/40",
    label: "Sandbox stopped",
  },
};
