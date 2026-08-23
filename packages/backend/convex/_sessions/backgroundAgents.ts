import type { BackgroundAgentEntry } from "../_validators/tableFields";

/**
 * Hard cap on how long one entry may block its surface's message queue. Entries
 * settle from the daemon (`settleSubagent` in callback-src), so an entry older
 * than this means the daemon died mid-run and will never report a terminal
 * status — without the cap that session's queue would stay blocked forever.
 * Matches the 2h workflow timeout used elsewhere for the same reason.
 */
export const BACKGROUND_AGENT_QUEUE_BLOCK_MS = 2 * 60 * 60 * 1000;

/** Terminal status stamped on entries orphaned by a dead daemon. */
const STALE_STATUS = "stale";

/** Merges daemon background-agent patches into the session doc array by toolUseId. */
export function mergeBackgroundAgents(
  existing: BackgroundAgentEntry[] | undefined,
  patches: BackgroundAgentEntry[],
): BackgroundAgentEntry[] {
  const byToolUseId = new Map<string, BackgroundAgentEntry>();
  for (const entry of existing ?? []) {
    byToolUseId.set(entry.toolUseId, entry);
  }
  for (const patch of patches) {
    const previous = byToolUseId.get(patch.toolUseId);
    byToolUseId.set(
      patch.toolUseId,
      previous ? { ...previous, ...patch } : patch,
    );
  }
  return [...byToolUseId.values()];
}

/**
 * Subagents still working: started, never settled, and recent enough to be
 * believable. A backgrounded Agent/Task outlives the turn that spawned it, so
 * this — not `activeWorkflowId` — is what says "the surface is still busy"
 * once the main turn has completed.
 */
export function runningBackgroundAgents(
  entries: BackgroundAgentEntry[] | undefined,
  now: number,
): BackgroundAgentEntry[] {
  return (entries ?? []).filter(
    (entry) =>
      entry.settledAt === undefined &&
      entry.status === "running" &&
      now - entry.startedAt < BACKGROUND_AGENT_QUEUE_BLOCK_MS,
  );
}

/**
 * Settles entries orphaned by a dead daemon, for callers that know no subagent
 * can still be alive (a fresh or resumed sandbox). Returns `null` when nothing
 * changed so the caller can skip the patch.
 */
export function settleOrphanedBackgroundAgents(
  entries: BackgroundAgentEntry[] | undefined,
  now: number,
): BackgroundAgentEntry[] | null {
  const orphans = (entries ?? []).filter(
    (entry) => entry.settledAt === undefined && entry.status === "running",
  );
  if (orphans.length === 0) {
    return null;
  }
  return (entries ?? []).map((entry) =>
    orphans.includes(entry)
      ? { ...entry, status: STALE_STATUS, settledAt: now }
      : entry,
  );
}
