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

export const DAYTONA_API_BASE = "https://app.daytona.io/api";

/** VM pilot resource limits (experimental VM region — 12 GiB, not container 16). */
export const VM_SNAPSHOT_RESOURCES = {
  cpu: 4,
  memory: 12,
  disk: 10,
} as const;

/** linux-vm runners live on Daytona's dedicated experimental region (12 GiB cap). */
export const VM_SNAPSHOT_REGION = "experimental";

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
 * Kicks off a VM base snapshot from a public OCI image (linux-vm). Declarative
 * buildInfo/dockerfile builds are container-only per Daytona docs — VM class uses
 * imageName pull, then bootstrapVmBaseTooling bakes Eva tooling via sandbox exec.
 */
export async function kickOffVmBaseSnapshot(
  apiKey: string,
  name: string,
  _dockerfileContent: string,
  regionId: string = VM_SNAPSHOT_REGION,
): Promise<void> {
  const resp = await fetch(`${DAYTONA_API_BASE}/snapshots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name,
      imageName: "ubuntu:22.04",
      sandboxClass: "linux-vm",
      regionId,
      cpu: VM_SNAPSHOT_RESOURCES.cpu,
      memory: VM_SNAPSHOT_RESOURCES.memory,
      disk: VM_SNAPSHOT_RESOURCES.disk,
    }),
  });
  const body = await resp.text();
  if (!resp.ok) {
    throw new Error(`Daytona VM snapshot API error (${resp.status}): ${body}`);
  }
  if (body.length > 0) {
    console.log(
      `[vm-hot] kickOffVmBaseSnapshot response (${regionId}): ${body.slice(0, 500)}`,
    );
  }
}

type TriggerSandboxSnapshotOptions = {
  includeMemory?: boolean;
  apiKey?: string;
};

/**
 * Fires a sandbox→snapshot capture and returns WITHOUT waiting for completion.
 *
 * Cold captures use the SDK helper (short timeout, DaytonaTimeoutError = still
 * building). Hot VM captures use the REST API with includeMemory=true because
 * the sandbox must stay started.
 */
export async function triggerSandboxSnapshot(
  daytona: Daytona,
  sandboxId: string,
  name: string,
  timeoutSec: number,
  options: TriggerSandboxSnapshotOptions = {},
): Promise<void> {
  const apiKey = options.apiKey;
  if (apiKey) {
    const body: { name: string; includeMemory?: boolean } = { name };
    if (options.includeMemory === true) {
      body.includeMemory = true;
    }
    const resp = await fetch(
      `${DAYTONA_API_BASE}/sandbox/${encodeURIComponent(sandboxId)}/snapshot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Daytona snapshot API error (${resp.status}): ${text}`);
    }
    return;
  }

  const sandbox = await daytona.get(sandboxId);
  try {
    await sandbox._experimental_createSnapshot(name, timeoutSec);
  } catch (e) {
    if (!(e instanceof DaytonaTimeoutError)) throw e;
  }
}
