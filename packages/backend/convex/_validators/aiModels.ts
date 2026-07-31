import { v } from "convex/values";
import type {
  CursorComposerCapability,
  CursorEvaModel,
} from "../../cursorCapabilities";

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
  v.literal("codex:gpt-5.5"),
  // Legacy Codex — still accepted so existing sessions can load;
  // normalizeAIModel maps them to gpt-5.5.
  v.literal("codex:gpt-5.5-pro"),
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
  v.literal("cursor:gpt-5.5-low"),
  v.literal("cursor:gemini-3.1-pro"),
  v.literal("cursor:composer-2.5"),
  // Legacy — still accepted so existing sessions with these lastModel values
  // can load; normalizeAIModel remaps them.
  v.literal("cursor:gpt-5.5-high"),
  v.literal("cursor:composer-2"),
);

/**
 * Abstract, provider-neutral reasoning effort levels for the traits menu.
 * Threaded to the sandbox as `AI_REASONING_EFFORT` only when the user picks a
 * non-default level; mapped per provider in `callback-src/config.ts` (Claude
 * `--effort`, Codex `model_reasoning_effort`).
 */
export const REASONING_LEVELS = [
  "off",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;
export type ReasoningLevel = (typeof REASONING_LEVELS)[number];

export const reasoningLevelValidator = v.union(
  v.literal("off"),
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("xhigh"),
  v.literal("max"),
);

/** Optional trait overrides threaded from composer → queue → sandbox runner. */
export const modelTraitsExecutionFields = {
  reasoningLevel: v.optional(reasoningLevelValidator),
  thinkingEnabled: v.optional(v.boolean()),
  use1mContext: v.optional(v.boolean()),
};

export const DEFAULT_REASONING_LEVEL: ReasoningLevel = "medium";

export interface ModelReasoningTraits {
  levels: ReadonlyArray<ReasoningLevel>;
  default: ReasoningLevel;
  ultrathink?: boolean;
}

export interface ModelTraits {
  reasoning?: ModelReasoningTraits;
  thinkingToggle?: boolean;
  contextWindow1m?: boolean;
}

export interface StoredModelTraits {
  effortLevel?: ReasoningLevel;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
}

export interface ModelTraitsExecutionArgs {
  reasoningLevel?: ReasoningLevel;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
}

export interface ModelTraitsDisplay {
  effortLevel: ReasoningLevel | undefined;
  thinkingEnabled: boolean;
  use1mContext: boolean;
}

export type ModelComposerControlDescriptor =
  | {
      kind: "select";
      id: "reasoningLevel";
      label: string;
      description: string;
      options: ReadonlyArray<{
        value: ReasoningLevel;
        label: string;
      }>;
      currentValue: ReasoningLevel;
      defaultValue: ReasoningLevel;
      mutableDuringActiveTurn: boolean;
      promptUltrathink: boolean;
      order: number;
    }
  | {
      kind: "boolean";
      id: "thinkingEnabled" | "use1mContext";
      label: string;
      description: string;
      currentValue: boolean;
      defaultValue: boolean;
      mutableDuringActiveTurn: boolean;
      order: number;
    };

export const providerComposerCapabilityValidator = v.union(
  v.object({
    kind: v.literal("select"),
    id: v.literal("reasoningLevel"),
    label: v.string(),
    description: v.string(),
    options: v.array(
      v.object({ value: reasoningLevelValidator, label: v.string() }),
    ),
    defaultValue: reasoningLevelValidator,
  }),
  v.object({
    kind: v.literal("boolean"),
    id: v.union(v.literal("thinkingEnabled"), v.literal("use1mContext")),
    label: v.string(),
    description: v.string(),
    defaultValue: v.boolean(),
  }),
);

const CLAUDE_REASONING_FULL: ModelReasoningTraits = {
  levels: ["low", "medium", "high", "xhigh", "max"],
  default: "high",
  ultrathink: true,
};

const CLAUDE_REASONING_NO_XHIGH: ModelReasoningTraits = {
  levels: ["low", "medium", "high", "max"],
  default: "high",
};

const CLAUDE_REASONING_OPUS_46: ModelReasoningTraits = {
  levels: ["low", "medium", "high", "max"],
  default: "high",
  ultrathink: true,
};

/** GPT-5.5: none/off, low, medium (default), high, xhigh. */
const CODEX_REASONING: ModelReasoningTraits = {
  levels: ["off", "low", "medium", "high", "xhigh"],
  default: "medium",
};

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
  | "codex:gpt-5.5"
  | "opencode:openai/gpt-5-codex"
  | "opencode:openai/gpt-5.2"
  | "opencode:openai/gpt-5.3-codex"
  | "opencode:openai/gpt-5.4"
  | "opencode:openai/gpt-5.4-mini"
  | CursorEvaModel;
export type PersistedAIModel =
  | AIModel
  | LegacyClaudeModel
  | "codex:gpt-5.5-pro"
  | "codex:gpt-5.4"
  | "codex:gpt-5.4-mini"
  | "codex:gpt-5.3-codex"
  | "codex:gpt-5.2-codex"
  | "cursor:gpt-5.5-high"
  | "cursor:composer-2";

export interface AIModelOption {
  id: AIModel;
  provider: AIProvider;
  label: string;
  requiresAuth: boolean;
  reasoning?: ModelReasoningTraits;
  thinkingToggle?: boolean;
  contextWindow1m?: boolean;
}

export interface AIProviderAvailability {
  claude: boolean;
  codex: boolean;
  opencode: boolean;
  cursor: boolean;
}

export const DEFAULT_AI_MODEL: AIModel = "claude:sonnet";

export const AI_MODEL_OPTIONS: ReadonlyArray<AIModelOption> = [
  {
    id: "claude:opus",
    provider: "claude",
    label: "Opus",
    requiresAuth: true,
    reasoning: CLAUDE_REASONING_FULL,
  },
  {
    id: "claude:sonnet",
    provider: "claude",
    label: "Sonnet",
    requiresAuth: true,
    reasoning: CLAUDE_REASONING_FULL,
    contextWindow1m: true,
  },
  {
    id: "claude:haiku",
    provider: "claude",
    label: "Haiku",
    requiresAuth: true,
    thinkingToggle: true,
  },
  {
    id: "claude:opusplan",
    provider: "claude",
    label: "Opus Plan",
    requiresAuth: true,
    reasoning: CLAUDE_REASONING_FULL,
  },
  {
    id: "claude:claude-opus-4-5-20251101",
    provider: "claude",
    label: "Opus 4.5",
    requiresAuth: true,
    reasoning: CLAUDE_REASONING_NO_XHIGH,
  },
  {
    id: "claude:claude-opus-4-6",
    provider: "claude",
    label: "Opus 4.6",
    requiresAuth: true,
    reasoning: CLAUDE_REASONING_OPUS_46,
    contextWindow1m: true,
  },
  {
    id: "claude:claude-fable-5",
    provider: "claude",
    label: "Fable 5",
    requiresAuth: true,
    reasoning: CLAUDE_REASONING_FULL,
    contextWindow1m: true,
  },
  {
    id: "codex:gpt-5.5",
    provider: "codex",
    label: "GPT 5.5",
    requiresAuth: true,
    reasoning: CODEX_REASONING,
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
    id: "cursor:gpt-5.5-low",
    provider: "cursor",
    label: "GPT-5.5 Low",
    requiresAuth: true,
  },
  {
    id: "cursor:gemini-3.1-pro",
    provider: "cursor",
    label: "Gemini 3.1 Pro",
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

/**
 * The canonical auth env-var key per provider. Used to mark a provider
 * "available" when a user has their own account for it, and as the primary
 * credential field in the Accounts UI.
 */
export const PROVIDER_PRIMARY_AUTH_KEY: Record<AIProvider, string> = {
  claude: "CLAUDE_CODE_OAUTH_TOKEN",
  codex: "CODEX_AUTH_JSON",
  opencode: "OPENCODE_AUTH_JSON",
  cursor: "CURSOR_API_KEY",
};

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
    case "codex:gpt-5.5":
    case "codex:gpt-5.5-pro":
    case "codex:gpt-5.4":
    case "codex:gpt-5.4-mini":
    case "codex:gpt-5.3-codex":
    case "codex:gpt-5.2-codex":
      return "codex:gpt-5.5";
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
    case "cursor:gpt-5.5-low":
      return "cursor:gpt-5.5-low";
    case "cursor:gemini-3.1-pro":
      return "cursor:gemini-3.1-pro";
    case "cursor:composer-2":
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
 * Per-model trait capabilities (reasoning levels, thinking toggle, 1M context).
 */
export function getModelTraits(model: string | null | undefined): ModelTraits {
  const option = findAIModelOption(model);
  return {
    ...(option.reasoning ? { reasoning: option.reasoning } : {}),
    ...(option.thinkingToggle ? { thinkingToggle: true } : {}),
    ...(option.contextWindow1m ? { contextWindow1m: true } : {}),
  };
}

/** Resolves stored effort to a valid level for the model, or undefined when no reasoning trait. */
export function resolveReasoningLevel(
  model: string | null | undefined,
  stored: ReasoningLevel | undefined,
): ReasoningLevel | undefined {
  const { reasoning } = getModelTraits(model);
  if (!reasoning) return undefined;
  if (stored && reasoning.levels.includes(stored)) return stored;
  return reasoning.default;
}

export function modelHasTraits(model: string | null | undefined): boolean {
  const traits = getModelTraits(model);
  return Boolean(
    traits.reasoning || traits.thinkingToggle || traits.contextWindow1m,
  );
}

export function getReasoningLevelLabel(level: string): string {
  switch (level) {
    case "off":
      return "Minimal";
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "xhigh":
      return "Extra High";
    case "max":
      return "Max";
    default:
      return level;
  }
}

/** Display values for the traits menu (stored undefined → model defaults). */
export function resolveTraitsForDisplay(
  model: string | null | undefined,
  stored: StoredModelTraits,
  providerCapabilities?: ReadonlyArray<CursorComposerCapability>,
): ModelTraitsDisplay {
  if (providerCapabilities !== undefined) {
    const reasoning = providerCapabilities.find(
      (capability) => capability.id === "reasoningLevel",
    );
    const thinking = providerCapabilities.find(
      (capability) => capability.id === "thinkingEnabled",
    );
    const context = providerCapabilities.find(
      (capability) => capability.id === "use1mContext",
    );
    const storedEffort = stored.effortLevel;
    const effortLevel =
      reasoning?.kind === "select"
        ? reasoning.options.some((option) => option.value === storedEffort)
          ? storedEffort
          : reasoning.defaultValue
        : undefined;
    return {
      effortLevel,
      thinkingEnabled:
        stored.thinkingEnabled ??
        (thinking?.kind === "boolean" ? thinking.defaultValue : true),
      use1mContext:
        stored.use1mContext ??
        (context?.kind === "boolean" ? context.defaultValue : false),
    };
  }
  const traits = getModelTraits(model);
  return {
    effortLevel: traits.reasoning
      ? resolveReasoningLevel(model, stored.effortLevel)
      : undefined,
    thinkingEnabled: stored.thinkingEnabled ?? true,
    use1mContext: stored.use1mContext ?? false,
  };
}

/** Plain provider-normalized controls consumed by the React composer. */
export function describeModelComposerControls(
  model: string | null | undefined,
  display: ModelTraitsDisplay,
  providerCapabilities?: ReadonlyArray<CursorComposerCapability>,
): ReadonlyArray<ModelComposerControlDescriptor> {
  if (providerCapabilities !== undefined) {
    return providerCapabilities.map((capability) => {
      if (capability.kind === "select") {
        return {
          ...capability,
          currentValue: display.effortLevel ?? capability.defaultValue,
          mutableDuringActiveTurn: true,
          promptUltrathink: false,
          order: 10,
        };
      }
      return {
        ...capability,
        currentValue:
          capability.id === "thinkingEnabled"
            ? display.thinkingEnabled
            : display.use1mContext,
        mutableDuringActiveTurn: true,
        order: capability.id === "use1mContext" ? 20 : 30,
      };
    });
  }
  const traits = getModelTraits(model);
  const controls: ModelComposerControlDescriptor[] = [];
  if (traits.reasoning) {
    controls.push({
      kind: "select",
      id: "reasoningLevel",
      label: "Reasoning",
      description: "How much reasoning the provider should use.",
      options: traits.reasoning.levels.map((level) => ({
        value: level,
        label: getReasoningLevelLabel(level),
      })),
      currentValue: display.effortLevel ?? traits.reasoning.default,
      defaultValue: traits.reasoning.default,
      mutableDuringActiveTurn: true,
      promptUltrathink: traits.reasoning.ultrathink === true,
      order: 10,
    });
  }
  if (traits.contextWindow1m) {
    controls.push({
      kind: "boolean",
      id: "use1mContext",
      label: "1M context",
      description: "Use the provider's extended context window.",
      currentValue: display.use1mContext,
      defaultValue: false,
      mutableDuringActiveTurn: true,
      order: 20,
    });
  }
  if (traits.thinkingToggle) {
    controls.push({
      kind: "boolean",
      id: "thinkingEnabled",
      label: "Thinking",
      description: "Allow the provider's extended thinking mode.",
      currentValue: display.thinkingEnabled,
      defaultValue: true,
      mutableDuringActiveTurn: true,
      order: 30,
    });
  }
  return controls;
}

/**
 * Build execution payload: only non-default trait overrides are included so the
 * runner uses each model's native defaults when the user has not changed them.
 */
export function buildTraitsExecutionPayload(
  model: string | null | undefined,
  stored: StoredModelTraits,
  providerCapabilities?: ReadonlyArray<CursorComposerCapability>,
): ModelTraitsExecutionArgs {
  if (providerCapabilities !== undefined) {
    const display = resolveTraitsForDisplay(
      model,
      stored,
      providerCapabilities,
    );
    const payload: ModelTraitsExecutionArgs = {};
    for (const capability of providerCapabilities) {
      switch (capability.id) {
        case "reasoningLevel":
          payload.reasoningLevel =
            display.effortLevel ?? capability.defaultValue;
          break;
        case "thinkingEnabled":
          payload.thinkingEnabled = display.thinkingEnabled;
          break;
        case "use1mContext":
          payload.use1mContext = display.use1mContext;
          break;
      }
    }
    return payload;
  }
  const traits = getModelTraits(model);
  const payload: ModelTraitsExecutionArgs = {};

  if (traits.reasoning && stored.effortLevel !== undefined) {
    const { default: defaultLevel } = traits.reasoning;
    if (stored.effortLevel !== defaultLevel) {
      const resolved = resolveReasoningLevel(model, stored.effortLevel);
      if (resolved) {
        payload.reasoningLevel = resolved;
      }
    }
  }

  if (traits.thinkingToggle && stored.thinkingEnabled === false) {
    payload.thinkingEnabled = false;
  }

  if (traits.contextWindow1m && stored.use1mContext === true) {
    payload.use1mContext = true;
  }

  return payload;
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
