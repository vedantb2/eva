/**
 * Guards that stop a prewarm respawn from orphaning a durable turn's lease.
 *
 * `prewarmEntityDaemon` kills the per-entity agent daemon when the callback
 * bundle on disk went stale or the daemon's model/tools signature no longer
 * matches. Both kills raced the daemon's own 50ms `claimPendingTurn` poll: the
 * doomed process claimed the staged turn (server clears `pendingTurn` and
 * acquires the 2-minute running lease) and then died holding it, so nothing
 * heartbeated the lease and `turns.finalizeExpired` closed the turn with the
 * "Turn stalled" alert ~2.5 minutes later (sessions 125 and 129).
 *
 * Two pure decisions, shared by every surface prewarm can kill (sessions,
 * task chat, project chat):
 *  - `isDaemonClaimPaused` — the fence `claimPendingTurn` checks so no claim
 *    can land between "prewarm decided to kill" and "the process is gone".
 *  - `shouldDefer*Respawn` — when to not kill at all, because the daemon is
 *    still working. Deferring converges on its own: the daemon watches
 *    `/tmp/eva-callback-fp` and exits for respawn once its work settles.
 */

/**
 * How long a prewarm kill pauses turn claims. It only has to cover the exec
 * round-trip that kills the daemon (1–137ms observed), and prewarm clears it
 * as soon as that returns; the TTL is the backstop for a prewarm that dies
 * before clearing, so it must never be long enough to wedge a session.
 */
export const DAEMON_CLAIM_PAUSE_MS = 60_000;

/** The daemon-relevant turn state of one entity (`readDaemonEntitySnapshot`). */
export type DaemonTurnSnapshot = {
  /** A prompt is staged and claimable right now. */
  pendingTurnStaged: boolean;
  activeWorkflow: string | undefined;
  syntheticTurnMessageId: string | undefined;
};

/** A turn is open: either a workflow turn or a daemon-opened synthetic one. */
function isMidTurn(snapshot: DaemonTurnSnapshot): boolean {
  return (
    snapshot.activeWorkflow !== undefined ||
    snapshot.syntheticTurnMessageId !== undefined
  );
}

/**
 * Whether `claimPendingTurn` must hand back an empty claim without touching
 * `pendingTurn`. Callers still drain cancel/stop/usage first — the pause is
 * only about turn handoff, and a paused entity that never drained a cancel
 * would leave the user unable to interrupt.
 */
export function isDaemonClaimPaused(input: {
  claimPausedUntil: number | undefined;
  now: number;
}): boolean {
  return (
    input.claimPausedUntil !== undefined && input.now < input.claimPausedUntil
  );
}

/**
 * Whether prewarm must leave the daemon alive: a turn is open and no new turn
 * is staged, so the only thing a kill can achieve is losing work. The daemon
 * converges on its own — it exits for respawn once its work settles.
 *
 * A staged `pendingTurn` deliberately does NOT defer, on either kill path.
 * Someone is waiting on that prompt, and a daemon that is idle-but-doomed
 * (stale bundle on disk, or the wrong model) will exit or mismatch-poll rather
 * than claim it, so deferring would hang the turn instead of saving it. The
 * claim pause is what makes killing safe in that case.
 */
export function shouldDeferDaemonRespawn(snapshot: DaemonTurnSnapshot): boolean {
  return isMidTurn(snapshot) && !snapshot.pendingTurnStaged;
}
