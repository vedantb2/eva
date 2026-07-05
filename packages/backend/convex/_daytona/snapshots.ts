"use node";

import type { Daytona } from "@daytonaio/sdk";
import { DaytonaTimeoutError } from "@daytonaio/sdk";

/**
 * Daytona snapshot mechanics — the "how" of talking to the snapshot SDK,
 * centralized so the action/workflow layers own only the "when/why" (poll
 * cadence, retry policy, build-status transitions, per-app fallback).
 *
 * Every function takes an already-resolved `daytona` client as an explicit
 * parameter and never touches Convex ctx/DB — callers resolve the client and
 * apply their own domain policy (e.g. whether a missing API key fails the build
 * or throws).
 */

/** Narrowed view of a Daytona snapshot — the fields callers actually read. */
export type SnapshotInfo = {
  id: string;
  state: string;
  errorReason: string | null;
};

/**
 * Looks up a snapshot by name. Returns a narrowed SnapshotInfo, or null when the
 * snapshot is not registered (the SDK throws on not-found). Callers decide what
 * "missing" means — still building, already removed, etc.
 */
export async function getSnapshot(
  daytona: Daytona,
  name: string,
): Promise<SnapshotInfo | null> {
  try {
    const snapshot = await daytona.snapshot.get(name);
    return {
      id: String(snapshot.id),
      state: String(snapshot.state),
      errorReason:
        snapshot.errorReason != null ? String(snapshot.errorReason) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Deletes a snapshot by name. Returns true if it existed and was deleted, false
 * if it was not found. Never throws on a missing snapshot.
 */
export async function deleteSnapshotByName(
  daytona: Daytona,
  name: string,
): Promise<boolean> {
  try {
    const snapshot = await daytona.snapshot.get(name);
    await daytona.snapshot.delete(snapshot);
    return true;
  } catch {
    return false;
  }
}

/**
 * Polls until a snapshot name no longer resolves. snapshot.delete() returns
 * immediately but the snapshot lingers in a "removing" state, and recreating the
 * same name 409s until removal finishes. Best-effort and bounded: returns once
 * the snapshot is gone or the attempts are exhausted.
 */
export async function waitForSnapshotRemoval(
  daytona: Daytona,
  name: string,
  opts: { attempts?: number; intervalMs?: number } = {},
): Promise<void> {
  const attempts = opts.attempts ?? 30;
  const intervalMs = opts.intervalMs ?? 2000;
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    if ((await getSnapshot(daytona, name)) === null) return;
  }
}

/**
 * Fires a sandbox→snapshot capture (the seeded-DB filesystem snapshot) and
 * returns WITHOUT waiting for it to finish.
 *
 * The SDK helper blocks the caller polling the source sandbox's state for the
 * entire capture, which for a seeded DB volume routinely exceeds Convex's 600s
 * per-action ceiling. We pass a short timeout so the helper bails fast with a
 * DaytonaTimeoutError (the capture keeps running server-side) and let the caller
 * poll completion via getSnapshot. Any non-timeout error is a real failure and
 * propagates.
 */
export async function triggerSandboxSnapshot(
  daytona: Daytona,
  sandboxId: string,
  name: string,
  timeoutSec: number,
): Promise<void> {
  const sandbox = await daytona.get(sandboxId);
  try {
    await sandbox._experimental_createSnapshot(name, timeoutSec);
  } catch (e) {
    if (!(e instanceof DaytonaTimeoutError)) throw e;
  }
}
