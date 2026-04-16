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
export const OPENCODE_RUNTIME_HOME_DIR = "/tmp/opencode-home";
export const OPENCODE_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.opencode-persist";
const VOLUME_READY_TIMEOUT_MS = 45_000;
const VOLUME_READY_POLL_INTERVAL_MS = 1_000;

const VOLUME_INVALID_STATES = new Set([
  "error",
  "deleted",
  "deleting",
  "pending_delete",
]);

type PersistableSessionId =
  | Id<"sessions">
  | Id<"designSessions">
  | Id<"projects">;
type PersistableSessionKind = "sessions" | "designSessions" | "projects";
type PersistableRepoId = Id<"githubRepos">;
type PersistedProvider = "claude" | "codex" | "opencode";

/** Generates a SHA-256 hash of a session ID for use in volume naming. */
function sessionHash(sessionId: PersistableSessionId): string {
  return createHash("sha256").update(String(sessionId)).digest("hex");
}

/** Generates a SHA-256 hash of a repo ID for use in volume naming. */
function repoHash(repoId: PersistableRepoId): string {
  return createHash("sha256").update(String(repoId)).digest("hex");
}

/** Builds the current volume name for a repo (new naming convention). */
function repoVolumeName(repoId: PersistableRepoId): string {
  return `repo-${repoHash(repoId).slice(0, 24)}`;
}

/** Builds the legacy volume name for a repo (old naming convention). */
function legacySessionVolumeName(repoId: PersistableRepoId): string {
  return `sessions-${repoHash(repoId).slice(0, 24)}`;
}

/** Builds a subpath within a volume for a specific provider, session kind, and session. */
function sessionVolumeSubpath(
  provider: PersistedProvider,
  sessionKind: PersistableSessionKind,
  sessionId: PersistableSessionId,
): string {
  return `${provider}-sessions/${sessionKind}/${sessionHash(sessionId)}`;
}

/** Derives a deterministic UUID v4 from a session ID hash for Claude session identification. */
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

/** Tries to get an existing volume by name, returns null if not found. */
async function tryGetVolume(
  daytona: Daytona,
  volumeName: string,
): Promise<{ id: string; state: string } | null> {
  try {
    const volume = await daytona.volume.get(volumeName);
    if (VOLUME_INVALID_STATES.has(volume.state)) {
      return null;
    }
    return volume;
  } catch {
    return null;
  }
}

/** Waits for a volume to become ready, polling until timeout. */
async function waitForVolumeReady(
  daytona: Daytona,
  volumeName: string,
  initialVolume: { id: string; state: string },
): Promise<string> {
  const deadline = Date.now() + VOLUME_READY_TIMEOUT_MS;
  let volume = initialVolume;

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

  return volume.id;
}

/** Ensures the repo volume exists and is ready. Uses new naming, falls back to legacy for existing repos. */
async function ensureSessionProviderVolume(
  daytona: Daytona,
  repoId: PersistableRepoId,
): Promise<string> {
  const newName = repoVolumeName(repoId);
  const legacyName = legacySessionVolumeName(repoId);

  // Try new name first
  const newVolume = await tryGetVolume(daytona, newName);
  if (newVolume) {
    return await waitForVolumeReady(daytona, newName, newVolume);
  }

  // Fall back to legacy name for existing repos
  const legacyVolume = await tryGetVolume(daytona, legacyName);
  if (legacyVolume) {
    return await waitForVolumeReady(daytona, legacyName, legacyVolume);
  }

  // Neither exists — create with new name
  const volume = await daytona.volume.get(newName, true);
  return await waitForVolumeReady(daytona, newName, volume);
}

/** Creates and returns shared-session volume mounts for both Claude and Codex persistence. */
export async function ensureSessionPersistenceVolumes(
  daytona: Daytona,
  repoId: PersistableRepoId,
  sessionKind: PersistableSessionKind,
  sessionId: PersistableSessionId,
): Promise<VolumeMount[]> {
  const volumeId = await ensureSessionProviderVolume(daytona, repoId);
  return [
    {
      volumeId,
      mountPath: CLAUDE_PERSIST_VOLUME_MOUNT_PATH,
      subpath: sessionVolumeSubpath("claude", sessionKind, sessionId),
    },
    {
      volumeId,
      mountPath: CODEX_PERSIST_VOLUME_MOUNT_PATH,
      subpath: sessionVolumeSubpath("codex", sessionKind, sessionId),
    },
    {
      volumeId,
      mountPath: OPENCODE_PERSIST_VOLUME_MOUNT_PATH,
      subpath: sessionVolumeSubpath("opencode", sessionKind, sessionId),
    },
  ];
}
