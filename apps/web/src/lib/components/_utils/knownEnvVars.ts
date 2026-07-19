import {
  CODEX_AUTH_ENV_KEYS,
  OPENCODE_AUTH_ENV_KEYS,
  CURSOR_AUTH_ENV_KEYS,
} from "@conductor/backend";
import {
  ClaudeLogo,
  OpenAILogo,
  OpenCodeLogo,
  CursorLogo,
} from "@/lib/components/ui/providerLogos";
import type { EnvVarSlotEntry } from "./envVarSlotTypes";
import { INFRA_ENV_VARS } from "./infraEnvVars";
import { slotEnvVarKeys } from "./envVarSlotTypes";

/** Non-secret env key for the sandbox provider toggle (`daytona` | `vercel`). */
export const SANDBOX_PROVIDER_KEY = "SANDBOX_PROVIDER";

export type { EnvVarSlotEntry, EnvVarScope } from "./envVarSlotTypes";
export { filterSlotsForScope, slotEnvVarKeys } from "./envVarSlotTypes";
export { INFRA_ENV_VARS } from "./infraEnvVars";

/**
 * Coding-agent auth vars surfaced as first-class "paste-in" slots. `matchKeys`
 * reuse the backend's exported key lists (the single source of truth for which
 * env vars unlock each agent — see `getAIProviderAvailability`).
 */
export const KNOWN_ENV_VARS: ReadonlyArray<EnvVarSlotEntry> = [
  {
    id: "claude",
    label: "Claude Code",
    primaryKey: "CLAUDE_CODE_OAUTH_TOKEN",
    matchKeys: ["CLAUDE_CODE_OAUTH_TOKEN"],
    Logo: ClaudeLogo,
    hint: "OAuth token from `claude setup-token` to enable Claude agents.",
    placeholder: "sk-ant-oat...",
    multiline: false,
  },
  {
    id: "codex",
    label: "Codex",
    primaryKey: "CODEX_AUTH_JSON",
    matchKeys: CODEX_AUTH_ENV_KEYS,
    Logo: OpenAILogo,
    hint: "Contents of ~/.codex/auth.json to enable Codex.",
    placeholder: '{ "OPENAI_API_KEY": "...", "tokens": { ... } }',
    multiline: true,
  },
  {
    id: "opencode",
    label: "OpenCode",
    primaryKey: "OPENCODE_AUTH_JSON",
    matchKeys: OPENCODE_AUTH_ENV_KEYS,
    Logo: OpenCodeLogo,
    hint: "Contents of ~/.local/share/opencode/auth.json to enable OpenCode.",
    placeholder: '{ "openai": { "type": "oauth", ... } }',
    multiline: true,
  },
  {
    id: "cursor",
    label: "Cursor",
    primaryKey: "CURSOR_API_KEY",
    matchKeys: CURSOR_AUTH_ENV_KEYS,
    Logo: CursorLogo,
    hint: "Cursor API key to enable Cursor models.",
    placeholder: "key_...",
    multiline: false,
  },
];

/** Agent + infra keys owned by slots — hidden from the free-form table. */
export const SLOT_ENV_VAR_KEYS: ReadonlySet<string> = new Set([
  ...slotEnvVarKeys([...KNOWN_ENV_VARS, ...INFRA_ENV_VARS]),
  SANDBOX_PROVIDER_KEY,
]);

/** @deprecated Use SLOT_ENV_VAR_KEYS */
export const KNOWN_ENV_VAR_KEYS = SLOT_ENV_VAR_KEYS;
