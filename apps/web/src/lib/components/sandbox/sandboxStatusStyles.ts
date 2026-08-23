/**
 * Shared visual styles for the sandbox status dot — used by the session sidebar
 * item, the quick-task card and the sandbox tab bar's status chip. Each state
 * maps to a tailwind class for the dot and a human label for the tooltip /
 * `title` attribute.
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

/**
 * The three sandbox surfaces each hold the same pair of booleans rather than a
 * status, so the mapping lives here instead of being re-derived per call site.
 * `starting` wins: the sandbox is not usable yet even though a stale `isActive`
 * may still read true from the previous run.
 */
export function resolveSandboxStatus(options: {
  isActive: boolean;
  isStarting?: boolean;
}): SandboxStatus {
  if (options.isStarting === true) return "starting";
  return options.isActive ? "active" : "closed";
}
