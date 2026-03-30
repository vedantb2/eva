"use node";

import { createHash } from "crypto";
import type { Daytona, VolumeMount } from "@daytonaio/sdk";
import type { Id } from "../_generated/dataModel";
import { sleep } from "./helpers";

export const CLAUDE_BASE_CONFIG_DIR = "/home/eva/.claude";
export const CLAUDE_RUNTIME_CONFIG_DIR = "/tmp/claude-config";
export const CLAUDE_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.claude-persist";
const VOLUME_READY_TIMEOUT_MS = 45_000;
const VOLUME_READY_POLL_INTERVAL_MS = 1_000;

const VOLUME_INVALID_STATES = new Set([
  "error",
  "deleted",
  "deleting",
  "pending_delete",
]);

type PersistableSessionId = Id<"sessions"> | Id<"designSessions">;
type PersistableSessionKind = "sessions" | "designSessions";
type PersistableRepoId = Id<"githubRepos">;

function sessionHash(sessionId: PersistableSessionId): string {
  return createHash("sha256").update(String(sessionId)).digest("hex");
}

function repoHash(repoId: PersistableRepoId): string {
  return createHash("sha256").update(String(repoId)).digest("hex");
}

export function sessionVolumeName(repoId: PersistableRepoId): string {
  return `claude-sessions-${repoHash(repoId).slice(0, 24)}`;
}

export function sessionVolumeSubpath(
  sessionKind: PersistableSessionKind,
  sessionId: PersistableSessionId,
): string {
  return `claude-sessions/${sessionKind}/${sessionHash(sessionId)}`;
}

export function sessionClaudeUuid(sessionId: PersistableSessionId): string {
  const hex = sessionHash(sessionId).slice(0, 32).split("");
  hex[12] = "4";
  const variantNibble = (parseInt(hex[16], 16) & 0x3) | 0x8;
  hex[16] = variantNibble.toString(16);
  return [
    hex.slice(0, 8).join(""),
    hex.slice(8, 12).join(""),
    hex.slice(12, 16).join(""),
    hex.slice(16, 20).join(""),
    hex.slice(20, 32).join(""),
  ].join("-");
}

export async function ensureSessionClaudeVolume(
  daytona: Daytona,
  repoId: PersistableRepoId,
  sessionKind: PersistableSessionKind,
  sessionId: PersistableSessionId,
): Promise<VolumeMount[]> {
  const volumeName = sessionVolumeName(repoId);
  const deadline = Date.now() + VOLUME_READY_TIMEOUT_MS;

  let volume = await daytona.volume.get(volumeName, true);
  while (volume.state !== "ready") {
    if (VOLUME_INVALID_STATES.has(volume.state)) {
      throw new Error(
        `Volume '${volumeName}' is in an invalid state. Current state: ${volume.state}`,
      );
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `Volume '${volumeName}' did not become ready within ${VOLUME_READY_TIMEOUT_MS}ms. Current state: ${volume.state}`,
      );
    }
    await sleep(VOLUME_READY_POLL_INTERVAL_MS);
    volume = await daytona.volume.get(volumeName);
  }

  return [
    {
      volumeId: volume.id,
      mountPath: CLAUDE_PERSIST_VOLUME_MOUNT_PATH,
      subpath: sessionVolumeSubpath(sessionKind, sessionId),
    },
  ];
}
