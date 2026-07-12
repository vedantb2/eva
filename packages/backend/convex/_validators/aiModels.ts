import { v } from "convex/values";

export const aiProviderValidator = v.union(
  v.literal("claude"),
  v.literal("codex"),
  v.literal("opencode"),
  v.literal("cursor"),
);

export const aiModelValidator = v.union(
  v.literal("opus"),
  v.literal("sonnet"),
  v.literal("haiku"),
  v.literal("claude:opus"),
  v.literal("claude:sonnet"),
  v.literal("claude:haiku"),
  v.literal("claude:opusplan"),
  v.literal("claude:claude-opus-4-5-20251101"),
  v.literal("claude:claude-opus-4-6"),
  v.literal("claude:claude-fable-5"),
  v.literal("codex:gpt-5.4"),
  v.literal("codex:gpt-5.4-mini"),
  v.literal("codex:gpt-5.3-codex"),
  v.literal("codex:gpt-5.2-codex"),
  v.literal("opencode:openai/gpt-5-codex"),
  v.literal("opencode:openai/gpt-5.2"),
  v.literal("opencode:openai/gpt-5.3-codex"),
  v.literal("opencode:openai/gpt-5.4"),
  v.literal("opencode:openai/gpt-5.4-mini"),
  v.literal("cursor:grok-4.5-low"),
  v.literal("cursor:grok-4.5-medium"),
  v.literal("cursor:grok-4.5-high"),
  v.literal("cursor:gpt-5.5-high"),
  v.literal("cursor:gemini-3.1-pro"),
  v.literal("cursor:composer-2"),
  v.literal("cursor:composer-2.5"),
);

/**
 * Abstract, provider-neutral reasoning effort levels shown on the chat input
 * lever. A single level is threaded to the sandbox as the `AI_REASONING_EFFORT`
 * env var and mapped to each provider's native control in the callback runner
 * (`callback-src/config.ts`): Claude -> `MAX_THINKING_TOKENS`, Codex ->
 * `model_reasoning_effort`. Only Claude and Codex expose a runtime lever, so the
 * UI hides it for other providers (see `providerSupportsReasoning`).
 */
export const REASONING_LEVELS = [
  "off",
  "low",
  "medium",
  "high",
  "max",
] as const;
export type ReasoningLevel = (typeof REASONING_LEVELS)[number];

export const reasoningLevelValidator = v.union(
  v.literal("off"),
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("max"),
);

export const DEFAULT_REASONING_LEVEL: ReasoningLevel = "medium";

export type AIProvider = "claude" | "codex" | "opencode" | "cursor";
export type LegacyClaudeModel = "opus" | "sonnet" | "haiku";
export type AIModel =
  | "claude:opus"
  | "claude:sonnet"
  | "claude:haiku"
  | "claude:opusplan"
  | "claude:claude-opus-4-5-20251101"
  | "claude:claude-opus-4-6"
  | "claude:claude-fable-5"
  | "codex:gpt-5.4"
  | "codex:gpt-5.4-mini"
  | "codex:gpt-5.3-codex"
  | "codex:gpt-5.2-codex"
  | "opencode:openai/gpt-5-codex"
  | "opencode:openai/gpt-5.2"
  | "opencode:openai/gpt-5.3-codex"
  | "opencode:openai/gpt-5.4"
  | "opencode:openai/gpt-5.4-mini"
  | "cursor:grok-4.5-low"
  | "cursor:grok-4.5-medium"
  | "cursor:grok-4.5-high"
  | "cursor:gpt-5.5-high"
  | "cursor:gemini-3.1-pro"
  | "cursor:composer-2"
  | "cursor:composer-2.5";
export type PersistedAIModel = AIModel | LegacyClaudeModel;

export interface AIModelOption {
  id: AIModel;
  provider: AIProvider;
  label: string;
  requiresAuth: boolean;
}

export interface AIProviderAvailability {
  claude: boolean;
  codex: boolean;
  opencode: boolean;
  cursor: boolean;
}

export const DEFAULT_AI_MODEL: AIModel = "claude:sonnet";

export const AI_MODEL_OPTIONS: ReadonlyArray<AIModelOption> = [
  { id: "claude:opus", provider: "claude", label: "Opus", requiresAuth: true },
  {
    id: "claude:sonnet",
    provider: "claude",
    label: "Sonnet",
    requiresAuth: true,
  },
  {
    id: "claude:haiku",
    provider: "claude",
    label: "Haiku",
    requiresAuth: true,
  },
  {
    id: "claude:opusplan",
    provider: "claude",
    label: "Opus Plan",
    requiresAuth: true,
  },
  {
    id: "claude:claude-opus-4-5-20251101",
    provider: "claude",
    label: "Opus 4.5",
    requiresAuth: true,
  },
  {
    id: "claude:claude-opus-4-6",
    provider: "claude",
    label: "Opus 4.6",
    requiresAuth: true,
  },
  {
    id: "claude:claude-fable-5",
    provider: "claude",
    label: "Fable 5",
    requiresAuth: true,
  },
  {
    id: "codex:gpt-5.4",
    provider: "codex",
    label: "GPT-5.4",
    requiresAuth: true,
  },
  {
    id: "codex:gpt-5.4-mini",
    provider: "codex",
    label: "GPT-5.4 mini",
    requiresAuth: true,
  },
  {
    id: "codex:gpt-5.3-codex",
    provider: "codex",
    label: "GPT-5.3-Codex",
    requiresAuth: true,
  },
  {
    id: "codex:gpt-5.2-codex",
    provider: "codex",
    label: "GPT-5.2-Codex",
    requiresAuth: true,
  },
  {
    id: "opencode:openai/gpt-5-codex",
    provider: "opencode",
    label: "GPT-5 Codex",
    requiresAuth: true,
  },
  {
    id: "opencode:openai/gpt-5.4",
    provider: "opencode",
    label: "GPT-5.4",
    requiresAuth: true,
  },
  {
    id: "opencode:openai/gpt-5.4-mini",
    provider: "opencode",
    label: "GPT-5.4 mini",
    requiresAuth: true,
  },
  {
    id: "opencode:openai/gpt-5.3-codex",
    provider: "opencode",
    label: "GPT-5.3 Codex",
    requiresAuth: true,
  },
  {
    id: "opencode:openai/gpt-5.2",
    provider: "opencode",
    label: "GPT-5.2",
    requiresAuth: true,
  },
  {
    id: "cursor:grok-4.5-low",
    provider: "cursor",
    label: "Grok 4.5 Low",
    requiresAuth: true,
  },
  {
    id: "cursor:grok-4.5-medium",
    provider: "cursor",
    label: "Grok 4.5 Medium",
    requiresAuth: true,
  },
  {
    id: "cursor:grok-4.5-high",
    provider: "cursor",
    label: "Grok 4.5 High",
    requiresAuth: true,
  },
  {
    id: "cursor:gpt-5.5-high",
    provider: "cursor",
    label: "GPT-5.5 High",
    requiresAuth: true,
  },
  {
    id: "cursor:gemini-3.1-pro",
    provider: "cursor",
    label: "Gemini 3.1 Pro",
    requiresAuth: true,
  },
  {
    id: "cursor:composer-2",
    provider: "cursor",
    label: "Composer 2",
    requiresAuth: true,
  },
  {
    id: "cursor:composer-2.5",
    provider: "cursor",
    label: "Composer 2.5",
    requiresAuth: true,
  },
];

export const CLAUDE_MODELS: ReadonlyArray<AIModel> = AI_MODEL_OPTIONS.filter(
  (option) => option.provider === "claude",
).map((option) => option.id);
export const CODEX_MODELS: ReadonlyArray<AIModel> = AI_MODEL_OPTIONS.filter(
  (option) => option.provider === "codex",
).map((option) => option.id);
export const OPENCODE_MODELS: ReadonlyArray<AIModel> = AI_MODEL_OPTIONS.filter(
  (option) => option.provider === "opencode",
).map((option) => option.id);
export const CURSOR_MODELS: ReadonlyArray<AIModel> = AI_MODEL_OPTIONS.filter(
  (option) => option.provider === "cursor",
).map((option) => option.id);

export const CODEX_AUTH_ENV_KEYS: ReadonlyArray<string> = [
  "CODEX_AUTH_JSON",
  "CODEX_AUTH_JSON_BASE64",
];
export const CODEX_CONFIG_ENV_KEYS: ReadonlyArray<string> = [
  "CODEX_CONFIG_TOML",
  "CODEX_CONFIG_TOML_BASE64",
];
export const OPENCODE_AUTH_ENV_KEYS: ReadonlyArray<string> = [
  "OPENCODE_CONFIG_JSON",
  "OPENCODE_CONFIG_JSON_BASE64",
  "OPENCODE_AUTH_JSON",
  "OPENCODE_AUTH_JSON_BASE64",
];
export const CURSOR_AUTH_ENV_KEYS: ReadonlyArray<string> = ["CURSOR_API_KEY"];

/** Determines which AI providers are available based on the presence of required env var keys. */
export function getAIProviderAvailability(
  envVarKeys: Iterable<string>,
): AIProviderAvailability {
  const keys = envVarKeys instanceof Set ? envVarKeys : new Set(envVarKeys);
  return {
    claude: keys.has("CLAUDE_CODE_OAUTH_TOKEN"),
    codex: CODEX_AUTH_ENV_KEYS.some((key) => keys.has(key)),
    opencode: OPENCODE_AUTH_ENV_KEYS.some((key) => keys.has(key)),
    cursor: CURSOR_AUTH_ENV_KEYS.some((key) => keys.has(key)),
  };
}

/** Normalizes a raw model string (including legacy formats) to a canonical AIModel value. */
export function normalizeAIModel(model: string | null | undefined): AIModel {
  switch (model) {
    case "opus":
    case "claude:opus":
      return "claude:opus";
    case "haiku":
    case "claude:haiku":
      return "claude:haiku";
    case "opusplan":
    case "claude:opusplan":
      return "claude:opusplan";
    case "claude-opus-4-5-20251101":
    case "claude:claude-opus-4-5-20251101":
      return "claude:claude-opus-4-5-20251101";
    case "claude-opus-4-6":
    case "claude:claude-opus-4-6":
      return "claude:claude-opus-4-6";
    case "fable":
    case "claude:fable":
    case "claude-fable-5":
    case "claude:claude-fable-5":
      return "claude:claude-fable-5";
    case "codex:gpt-5.4":
      return "codex:gpt-5.4";
    case "codex:gpt-5.4-mini":
      return "codex:gpt-5.4-mini";
    case "codex:gpt-5.3-codex":
      return "codex:gpt-5.3-codex";
    case "codex:gpt-5.2-codex":
      return "codex:gpt-5.2-codex";
    case "opencode:openai/gpt-5-codex":
      return "opencode:openai/gpt-5-codex";
    case "opencode:openai/gpt-5.2":
      return "opencode:openai/gpt-5.2";
    case "opencode:openai/gpt-5.3-codex":
      return "opencode:openai/gpt-5.3-codex";
    case "opencode:openai/gpt-5.4":
      return "opencode:openai/gpt-5.4";
    case "opencode:openai/gpt-5.4-mini":
      return "opencode:openai/gpt-5.4-mini";
    case "cursor:claude-4.6-sonnet-medium-thinking":
      return "cursor:grok-4.5-medium";
    case "cursor:claude-opus-4-7-thinking-high":
    case "cursor:claude-4.6-opus-high-thinking":
    case "cursor:claude-4.5-opus-high-thinking":
    case "cursor:gpt-5.4-high":
      return "cursor:grok-4.5-high";
    case "cursor:gpt-5.3-codex-high":
      return "cursor:composer-2.5";
    case "cursor:grok-4.5-low":
      return "cursor:grok-4.5-low";
    case "cursor:grok-4.5-medium":
      return "cursor:grok-4.5-medium";
    case "cursor:grok-4.5-high":
      return "cursor:grok-4.5-high";
    case "cursor:gpt-5.5-high":
      return "cursor:gpt-5.5-high";
    case "cursor:gemini-3.1-pro":
      return "cursor:gemini-3.1-pro";
    case "cursor:composer-2":
      return "cursor:composer-2";
    case "cursor:composer-2.5":
      return "cursor:composer-2.5";
    case "sonnet":
    case "claude:sonnet":
    default:
      return DEFAULT_AI_MODEL;
  }
}

/** Returns the AI provider ("claude" | "codex" | "opencode") for a given model string. */
export function getAIModelProvider(
  model: string | null | undefined,
): AIProvider {
  const normalized = normalizeAIModel(model);
  if (normalized.startsWith("codex:")) return "codex";
  if (normalized.startsWith("opencode:")) return "opencode";
  if (normalized.startsWith("cursor:")) return "cursor";
  return "claude";
}

/**
 * Whether a provider exposes a runtime reasoning-effort lever. Cursor bakes
 * reasoning into the model id (e.g. `cursor:...-high-thinking`) and Opencode has
 * no runtime control, so the chat input hides the lever for them.
 */
export function providerSupportsReasoning(provider: AIProvider): boolean {
  return provider === "claude" || provider === "codex";
}

/** Finds the full AIModelOption metadata for a given model string, falling back to the default. */
export function findAIModelOption(
  model: string | null | undefined,
): AIModelOption {
  const normalized = normalizeAIModel(model);
  const option = AI_MODEL_OPTIONS.find((entry) => entry.id === normalized);
  if (option) {
    return option;
  }
  return {
    id: DEFAULT_AI_MODEL,
    provider: "claude",
    label: "Sonnet",
    requiresAuth: true,
  };
}

/** Checks whether any Codex authentication environment variable is present and non-empty. */
export function hasCodexAuthEnvVar(envVars: Record<string, string>): boolean {
  return CODEX_AUTH_ENV_KEYS.some((key) => {
    const value = envVars[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

/** Returns the list of AI model options visible to the user based on provider availability. */
export function getVisibleAIModelOptions(
  availability: AIProviderAvailability | null | undefined,
  currentModel: string | null | undefined,
): ReadonlyArray<AIModelOption> {
  const normalizedCurrent = normalizeAIModel(currentModel);
  const currentProvider = getAIModelProvider(normalizedCurrent);
  const isClaudeVisible =
    availability === undefined ||
    availability === null ||
    availability.claude ||
    currentProvider === "claude";
  const isCodexVisible =
    availability?.codex === true || currentProvider === "codex";
  const isOpencodeVisible =
    availability?.opencode === true || currentProvider === "opencode";
  const isCursorVisible =
    availability?.cursor === true || currentProvider === "cursor";
  return AI_MODEL_OPTIONS.filter((option) => {
    if (option.provider === "codex") {
      return isCodexVisible;
    }
    if (option.provider === "opencode") {
      return isOpencodeVisible;
    }
    if (option.provider === "cursor") {
      return isCursorVisible;
    }
    return isClaudeVisible;
  });
}
