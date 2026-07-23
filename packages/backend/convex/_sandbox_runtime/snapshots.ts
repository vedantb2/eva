"use node";

import type { SandboxClient } from "../_sandbox/provider";

/**
 * Snapshot mechanics — the "how" of talking to the snapshot API, centralized so
 * the action/workflow layers own only the "when/why" (poll cadence, retry
 * policy, build-status transitions, per-app fallback).
 *
 * Every function takes an already-resolved provider {@link SandboxClient} and
 * never touches Convex ctx/DB — callers resolve the client and apply their own
 * domain policy (e.g. whether a missing key fails the build or throws).
 *
 * These functions preserve their own {@link SnapshotInfo} return shape (with the
 * raw provider state string) because the snapshot-build workflow still switches
 * on the provider native state machine; that logic moves to the neutral status in
 * the Phase 3 workflow port.
 */

/** Narrowed view of a snapshot — the fields callers actually read. */
export type SnapshotInfo = {
  id: string;
  state: string;
  errorReason: string | null;
};

/**
 * Looks up a snapshot by name. Returns a narrowed SnapshotInfo, or null when the
 * snapshot is not registered. Callers decide what "missing" means — still
 * building, already removed, etc.
 */
export async function getSnapshot(
  client: SandboxClient,
  name: string,
): Promise<SnapshotInfo | null> {
  const info = await client.getSnapshot(name);
  if (!info) return null;
  // `raw` carries the provider's native state string, which the build workflow
  // feeds to isTerminalSnapshotState / "active" checks.
  return { id: info.id, state: info.raw, errorReason: info.errorReason };
}

/**
 * Deletes a snapshot by name. Returns true if it existed and was deleted, false
 * if it was not found. Never throws on a missing snapshot.
 */
export async function deleteSnapshotByName(
  client: SandboxClient,
  name: string,
): Promise<boolean> {
  return await client.deleteSnapshot(name);
}

/**
 * Polls until a snapshot name no longer resolves. Deletion returns immediately
 * but the snapshot lingers in a "removing" state, and recreating the same name
 * 409s until removal finishes. Best-effort and bounded: returns once the
 * snapshot is gone or the attempts are exhausted.
 */
export async function waitForSnapshotRemoval(
  client: SandboxClient,
  name: string,
  opts: { attempts?: number; intervalMs?: number } = {},
): Promise<void> {
  const attempts = opts.attempts ?? 30;
  const intervalMs = opts.intervalMs ?? 2000;
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    if ((await getSnapshot(client, name)) === null) return;
  }
}

/**
 * Fires a sandbox→snapshot capture (the seeded-DB filesystem snapshot) and
 * returns WITHOUT waiting for it to finish.
 *
 * The provider's createSnapshot initiates the capture and returns fast (the
 * capture keeps running server-side); the caller polls completion via
 * getSnapshot. See {@link SandboxHandle.createSnapshot}.
 */
export async function triggerSandboxSnapshot(
  client: SandboxClient,
  sandboxId: string,
  name: string,
  timeoutSec: number,
): Promise<void> {
  const handle = await client.get(sandboxId);
  await handle.createSnapshot({ name, timeoutSeconds: timeoutSec });
}
