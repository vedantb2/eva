"use node";

import { createHash } from "crypto";
import type { Daytona, VolumeMount } from "@daytonaio/sdk";
import type { Id } from "../_generated/dataModel";
import { sleep } from "./helpers";

export const CLAUDE_BASE_CONFIG_DIR = "/home/eva/.claude";
export const CLAUDE_RUNTIME_CONFIG_DIR = "/tmp/claude-config";
export const CLAUDE_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.claude-persist";
export const CODEX_RUNTIME_HOME_DIR = "/tmp/codex-home";
export const CODEX_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.codex-persist";
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
type PersistedProvider = "claude" | "codex";

function sessionHash(sessionId: PersistableSessionId): string {
  return createHash("sha256").update(String(sessionId)).digest("hex");
}

function repoHash(repoId: PersistableRepoId): string {
  return createHash("sha256").update(String(repoId)).digest("hex");
}

function sessionVolumeName(
  provider: PersistedProvider,
  repoId: PersistableRepoId,
): string {
  return `${provider}-sessions-${repoHash(repoId).slice(0, 24)}`;
}

function sessionVolumeSubpath(
  provider: PersistedProvider,
  sessionKind: PersistableSessionKind,
  sessionId: PersistableSessionId,
): string {
  return `${provider}-sessions/${sessionKind}/${sessionHash(sessionId)}`;
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

async function ensureSessionProviderVolume(
  daytona: Daytona,
  repoId: PersistableRepoId,
  sessionKind: PersistableSessionKind,
  sessionId: PersistableSessionId,
  provider: PersistedProvider,
  mountPath: string,
): Promise<VolumeMount[]> {
  const volumeName = sessionVolumeName(provider, repoId);
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
      mountPath,
      subpath: sessionVolumeSubpath(provider, sessionKind, sessionId),
    },
  ];
}

export async function ensureSessionPersistenceVolumes(
  daytona: Daytona,
  repoId: PersistableRepoId,
  sessionKind: PersistableSessionKind,
  sessionId: PersistableSessionId,
): Promise<VolumeMount[]> {
  const [claudeMounts, codexMounts] = await Promise.all([
    ensureSessionProviderVolume(
      daytona,
      repoId,
      sessionKind,
      sessionId,
      "claude",
      CLAUDE_PERSIST_VOLUME_MOUNT_PATH,
    ),
    ensureSessionProviderVolume(
      daytona,
      repoId,
      sessionKind,
      sessionId,
      "codex",
      CODEX_PERSIST_VOLUME_MOUNT_PATH,
    ),
  ]);
  return [...claudeMounts, ...codexMounts];
}
