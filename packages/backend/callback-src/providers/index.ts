import { PROVIDER } from "../config.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import { cursorAdapter } from "./cursor.js";
import { opencodeAdapter } from "./opencode.js";
import type { ProviderAdapter } from "./types.js";

export type { ProviderAdapter } from "./types.js";

export function getProviderAdapter(
  provider: string = PROVIDER,
): ProviderAdapter {
  if (provider === "codex") return codexAdapter;
  if (provider === "opencode") return opencodeAdapter;
  if (provider === "cursor") return cursorAdapter;
  return claudeAdapter;
}
