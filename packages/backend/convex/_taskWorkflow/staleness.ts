import { z } from "zod";

/**
 * Pure staleness policy shared by the task and session watchdogs. No Convex
 * imports so unit tests can exercise the thresholds directly.
 *
 * The in-sandbox callback touches `streamingActivity.lastUpdatedAt` at least
 * every ~15s while it is alive (10s transport pings during silent tool runs),
 * so silence beyond a phase-appropriate threshold means the process is gone —
 * not merely quiet.
 */

export const STALE_THRESHOLD_MS = 300_000;
export const STALE_CHECK_DELAY_MS = 90_000;
export const STALE_RECHECK_MS = 30_000;
export const STALE_FINISHING_THRESHOLD_MS = 600_000;
export const STALE_NO_SANDBOX_THRESHOLD_MS = 900_000;
// Extended threshold for when the agent is demonstrably running a long tool
// (e.g. `pnpm build`, `pnpm install`) with output redirected away from the
// terminal. During that window stream-json emits nothing new, so the only
// thing bumping `streamingActivity.lastUpdatedAt` is the 10s heartbeat — if
// transport has a transient issue we don't want to kill a run that's mid-build.
// Paired with the pre-kill liveness probe, we only apply this when we've
// confirmed the callback PID is still alive.
export const STALE_TOOL_ACTIVE_THRESHOLD_MS = 1_500_000;

const SANDBOX_STARTUP_LABELS = new Set([
  "Starting sandbox...",
  "Creating sandbox...",
  "Resuming sandbox...",
  "Syncing repository...",
  "Cloning repository...",
  "Installing dependencies...",
  "Fetching base branch...",
  "Checking out base branch...",
  "Setting up branch...",
  "Starting desktop...",
  "Retrying sandbox setup...",
]);

/** Labels shown while the agent is doing real work (grep, bash, read, etc.). */
const AGENT_WORK_LABELS = new Set([
  "Running command...",
  "Searching code...",
  "Searching files...",
  "Reading file...",
  "Creating file...",
  "Editing file...",
  "Using Skill...",
  "Fetching URL...",
  "Searching web...",
  "Running agent...",
  "Updating tasks...",
  "Reading tasks...",
]);

const activeStreamingStepSchema = z.object({
  label: z.string(),
  status: z.literal("active"),
});

/** Parses streaming activity JSON and returns labels of steps with "active" status. */
function getActiveStreamingLabels(
  currentActivity: string | undefined,
): string[] {
  if (!currentActivity) {
    return [];
  }
  try {
    const parsed = JSON.parse(currentActivity);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((item) => {
      const step = activeStreamingStepSchema.safeParse(item);
      return step.success && step.data.label ? [step.data.label] : [];
    });
  } catch {
    return [];
  }
}

/** Returns true if the current streaming activity indicates sandbox startup is still in progress. */
export function isSandboxStartupActivity(
  currentActivity: string | undefined,
  opts: { hasSandbox: boolean; runStartedAt?: number; now?: number },
): boolean {
  if (!currentActivity) {
    // Empty activity with an attached sandbox is usually heartbeat drift, not
    // startup — otherwise we apply the 15m startup threshold incorrectly.
    if (
      opts.hasSandbox &&
      opts.runStartedAt !== undefined &&
      (opts.now ?? Date.now()) - opts.runStartedAt > 120_000
    ) {
      return false;
    }
    return true;
  }
  const activeLabels = getActiveStreamingLabels(currentActivity);
  if (activeLabels.some((label) => SANDBOX_STARTUP_LABELS.has(label))) {
    return true;
  }
  return currentActivity.includes('"Starting sandbox..."');
}

/** Fallback when step status is missing from JSON but label text is present. */
function activityShowsAgentWork(currentActivity: string | undefined): boolean {
  if (!currentActivity) {
    return false;
  }
  for (const label of AGENT_WORK_LABELS) {
    if (currentActivity.includes(`"label":"${label}"`)) {
      return true;
    }
  }
  return false;
}

/** Returns true if the current streaming activity indicates the run is finalizing. */
export function isFinalizingActivity(
  currentActivity: string | undefined,
): boolean {
  if (!currentActivity) {
    return false;
  }
  return currentActivity.includes('"Finalizing response..."');
}

/**
 * Returns true when an agent tool step (Bash, tool-use, etc.) is currently
 * active and we are past sandbox startup/finalization. Used to extend the
 * stale threshold — long-running shell commands (e.g. `pnpm build 2>&1 | tail`)
 * silence stream-json output entirely, so the only thing keeping the heartbeat
 * alive is the 10s transport ping. Extending the threshold here lets the
 * pre-kill liveness probe absorb transient heartbeat transport hiccups without
 * killing a demonstrably-live build.
 */
export function hasActiveAgentToolStep(
  currentActivity: string | undefined,
): boolean {
  const activeLabels = getActiveStreamingLabels(currentActivity);
  if (
    activeLabels.some(
      (label) =>
        !SANDBOX_STARTUP_LABELS.has(label) &&
        label !== "Finalizing response...",
    )
  ) {
    return true;
  }
  return activityShowsAgentWork(currentActivity);
}

export type StaleTurnPhase = "startup" | "tool" | "finishing" | "idle";

export type StaleTurnDecision = {
  stale: boolean;
  phase: StaleTurnPhase;
  thresholdMs: number;
  ageMs: number;
};

/**
 * Staleness decision for one agent turn. Sandbox startup steps (clone,
 * install) legitimately go minutes between streaming writes, long silent
 * tools leave only the transport ping, finalization gets a middle allowance,
 * and everything else must heartbeat within STALE_THRESHOLD_MS. The clock
 * never starts before `turnStartedAt`, so a turn whose streaming row was
 * wiped at staging is measured from its own start, not from epoch.
 */
export function staleTurnDecision(input: {
  currentActivity: string | undefined;
  lastUpdatedAt: number | undefined;
  turnStartedAt: number;
  hasSandbox: boolean;
  now: number;
}): StaleTurnDecision {
  const startup = isSandboxStartupActivity(input.currentActivity, {
    hasSandbox: input.hasSandbox,
    runStartedAt: input.turnStartedAt,
    now: input.now,
  });
  const finishing = !startup && isFinalizingActivity(input.currentActivity);
  const tool =
    !startup && !finishing && hasActiveAgentToolStep(input.currentActivity);
  const phase: StaleTurnPhase = startup
    ? "startup"
    : tool
      ? "tool"
      : finishing
        ? "finishing"
        : "idle";
  const thresholdMs =
    phase === "startup"
      ? STALE_NO_SANDBOX_THRESHOLD_MS
      : phase === "tool"
        ? STALE_TOOL_ACTIVE_THRESHOLD_MS
        : phase === "finishing"
          ? STALE_FINISHING_THRESHOLD_MS
          : STALE_THRESHOLD_MS;
  const ageMs =
    input.now - Math.max(input.lastUpdatedAt ?? 0, input.turnStartedAt);
  return { stale: ageMs > thresholdMs, phase, thresholdMs, ageMs };
}
