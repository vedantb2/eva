import { PROVIDER } from "../config.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import { opencodeAdapter } from "./opencode.js";
import type { ProviderAdapter } from "./types.js";

export type { ProviderAdapter } from "./types.js";

export function getProviderAdapter(
  provider: string = PROVIDER,
): ProviderAdapter {
  if (provider === "cursor") {
    throw new Error("Cursor events must be handled by the ACP runtime");
  }
  if (provider === "codex") return codexAdapter;
  if (provider === "opencode") return opencodeAdapter;
  return claudeAdapter;
}
