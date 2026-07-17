import {
  CODEX_AUTH_ENV_KEYS,
  OPENCODE_AUTH_ENV_KEYS,
  CURSOR_AUTH_ENV_KEYS,
} from "@conductor/backend";
import type { ComponentType } from "react";
import {
  ClaudeLogo,
  OpenAILogo,
  OpenCodeLogo,
  CursorLogo,
} from "@/lib/components/ui/providerLogos";

interface ProviderLogoProps {
  size?: number;
  className?: string;
}

export interface KnownEnvVar {
  /** Stable id for React keys and diffing. */
  provider: "claude" | "codex" | "opencode" | "cursor";
  /** Human label shown next to the logo. */
  label: string;
  /** The key the paste-in slot writes to. */
  primaryKey: string;
  /** Any of these keys present means the provider is configured. */
  matchKeys: ReadonlyArray<string>;
  /** Provider brand mark. */
  Logo: ComponentType<ProviderLogoProps>;
  /** One-line guidance shown under the label. */
  hint: string;
  /** Input placeholder. */
  placeholder: string;
  /** JSON/blob values use a Textarea instead of a single-line Input. */
  multiline: boolean;
}

/**
 * Coding-agent auth vars surfaced as first-class "paste-in" slots. `matchKeys`
 * reuse the backend's exported key lists (the single source of truth for which
 * env vars unlock each agent — see `getAIProviderAvailability`).
 */
export const KNOWN_ENV_VARS: ReadonlyArray<KnownEnvVar> = [
  {
    provider: "claude",
    label: "Claude Code",
    primaryKey: "CLAUDE_CODE_OAUTH_TOKEN",
    matchKeys: ["CLAUDE_CODE_OAUTH_TOKEN"],
    Logo: ClaudeLogo,
    hint: "OAuth token from `claude setup-token` to enable Claude agents.",
    placeholder: "sk-ant-oat...",
    multiline: false,
  },
  {
    provider: "codex",
    label: "Codex",
    primaryKey: "CODEX_AUTH_JSON",
    matchKeys: CODEX_AUTH_ENV_KEYS,
    Logo: OpenAILogo,
    hint: "Contents of ~/.codex/auth.json to enable Codex.",
    placeholder: '{ "OPENAI_API_KEY": "...", "tokens": { ... } }',
    multiline: true,
  },
  {
    provider: "opencode",
    label: "OpenCode",
    primaryKey: "OPENCODE_AUTH_JSON",
    matchKeys: OPENCODE_AUTH_ENV_KEYS,
    Logo: OpenCodeLogo,
    hint: "Contents of ~/.local/share/opencode/auth.json to enable OpenCode.",
    placeholder: '{ "openai": { "type": "oauth", ... } }',
    multiline: true,
  },
  {
    provider: "cursor",
    label: "Cursor",
    primaryKey: "CURSOR_API_KEY",
    matchKeys: CURSOR_AUTH_ENV_KEYS,
    Logo: CursorLogo,
    hint: "Cursor API key to enable Cursor models.",
    placeholder: "key_...",
    multiline: false,
  },
];

/** All keys owned by a known slot — used to hide them from the free-form table. */
export const KNOWN_ENV_VAR_KEYS: ReadonlySet<string> = new Set(
  KNOWN_ENV_VARS.flatMap((entry) => entry.matchKeys),
);
