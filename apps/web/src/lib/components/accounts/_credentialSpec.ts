import type { AIProvider } from "@eva/backend";

/** A single credential field a provider account collects. */
export interface CredentialFieldSpec {
  key: string;
  label: string;
  required: boolean;
  /** Render as a multi-line textarea (JSON/TOML blobs) instead of an input. */
  multiline?: boolean;
  placeholder?: string;
}

/** Human label for each provider. */
export const PROVIDER_LABELS: Record<AIProvider, string> = {
  claude: "Claude Code",
  codex: "Codex",
  opencode: "opencode",
  cursor: "Cursor",
};

/**
 * The credential fields collected per provider account. The primary field is
 * the agent's auth secret; optional fields carry provider config. Keys match
 * the env vars the in-sandbox runner reads (see callback-src/config.ts).
 */
export const PROVIDER_CREDENTIAL_FIELDS: Record<
  AIProvider,
  ReadonlyArray<CredentialFieldSpec>
> = {
  claude: [
    {
      key: "CLAUDE_CODE_OAUTH_TOKEN",
      label: "OAuth token",
      required: true,
      placeholder: "sk-ant-oat...",
    },
  ],
  cursor: [
    {
      key: "CURSOR_API_KEY",
      label: "API key",
      required: true,
      placeholder: "key_...",
    },
  ],
  codex: [
    {
      key: "CODEX_AUTH_JSON",
      label: "auth.json",
      required: true,
      multiline: true,
      placeholder: '{"OPENAI_API_KEY":"sk-..."}',
    },
    {
      key: "CODEX_CONFIG_TOML",
      label: "config.toml (optional)",
      required: false,
      multiline: true,
    },
  ],
  opencode: [
    {
      key: "OPENCODE_AUTH_JSON",
      label: "auth.json",
      required: true,
      multiline: true,
    },
    {
      key: "OPENCODE_CONFIG_JSON",
      label: "config.json (optional)",
      required: false,
      multiline: true,
    },
  ],
};
