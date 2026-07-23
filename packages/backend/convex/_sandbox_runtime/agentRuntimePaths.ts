"use node";

import { createHash } from "crypto";
import type { Id } from "../_generated/dataModel";

export const CLAUDE_BASE_CONFIG_DIR = "/home/eva/.claude";
export const CLAUDE_RUNTIME_CONFIG_DIR = "/tmp/claude-config";
export const CLAUDE_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.claude-persist";
export const CODEX_RUNTIME_HOME_DIR = "/tmp/codex-home";
export const CODEX_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.codex-persist";
export const OPENCODE_RUNTIME_HOME_DIR = "/tmp/opencode-home";
export const OPENCODE_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.opencode-persist";
export const CURSOR_RUNTIME_HOME_DIR = "/tmp/cursor-home";
export const CURSOR_PERSIST_VOLUME_MOUNT_PATH = "/home/eva/.cursor-persist";

type PersistableSessionId =
  | Id<"sessions">
  | Id<"designSessions">
  | Id<"projects">
  | Id<"agentTasks">;

/** Generates a SHA-256 hash of a session ID for deterministic derived identifiers. */
function idHash(id: PersistableSessionId): string {
  return createHash("sha256").update(String(id)).digest("hex");
}

/** Derives a deterministic UUID v4 from a session ID hash for Claude session identification. */
export function sessionClaudeUuid(sessionId: PersistableSessionId): string {
  const hex = idHash(sessionId).slice(0, 32).split("");
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
