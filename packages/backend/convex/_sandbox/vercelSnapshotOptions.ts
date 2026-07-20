/** Default TTL for auto-snapshots on persistent sandboxes (30 days). */
export const SNAPSHOT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Safety-net TTL if an ephemeral sandbox ever produces a snap_* (should not —
 * persistent:false skips auto-snapshot). Short so leaked storage self-heals.
 */
export const EPHEMERAL_SNAPSHOT_TTL_MS = 60 * 60 * 1000;

/**
 * Cap auto-snapshots (on stop) and explicit `snapshot()` calls to one per
 * sandbox lineage, deleting older ones immediately. Without this, persistent
 * sandboxes accumulate snap_* objects on every stop/resume cycle.
 * Explicit `expiration` prevents inheriting never-expire TTLs from seed snaps.
 * @see https://vercel.com/docs/sandbox/sdk-reference#keeplastsnapshots
 */
export const KEEP_LAST_SNAPSHOTS = {
  count: 1,
  deleteEvicted: true,
  expiration: SNAPSHOT_TTL_MS,
} as const;

/**
 * Create-time snapshot billing knobs for Vercel sandboxes.
 * Always set an explicit TTL so children of expiration:0 seeds do not inherit
 * never-expire storage; only persistent sandboxes get keepLastSnapshots.
 */
export function vercelSnapshotCreateOptions(persistent: boolean): {
  snapshotExpiration: number;
  keepLastSnapshots?: typeof KEEP_LAST_SNAPSHOTS;
} {
  if (persistent) {
    return {
      snapshotExpiration: SNAPSHOT_TTL_MS,
      keepLastSnapshots: KEEP_LAST_SNAPSHOTS,
    };
  }
  return { snapshotExpiration: EPHEMERAL_SNAPSHOT_TTL_MS };
}
