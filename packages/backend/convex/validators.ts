import { v } from "convex/values";

export const workflowCompleteValidator = v.object({
  success: v.boolean(),
  result: v.union(v.string(), v.null()),
  error: v.union(v.string(), v.null()),
  activityLog: v.union(v.string(), v.null()),
  pendingQuestion: v.optional(v.string()),
});

export const taskStatusValidator = v.union(
  v.literal("draft"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("code_review"),
  v.literal("business_review"),
  v.literal("done"),
  v.literal("cancelled"),
);

export const runStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("success"),
  v.literal("error"),
);

export const logLevelValidator = v.union(
  v.literal("info"),
  v.literal("warn"),
  v.literal("error"),
);

export const roleValidator = v.union(v.literal("user"), v.literal("assistant"));

export const sessionModeValidator = v.union(
  v.literal("edit"),
  v.literal("ask"),
  v.literal("execute"),
  v.literal("plan"),
);

export const sessionStatusValidator = v.union(
  v.literal("active"),
  v.literal("starting"),
  v.literal("closed"),
);

export const phaseValidator = v.union(
  v.literal("draft"),
  v.literal("finalized"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const indexingStatusValidator = v.union(
  v.literal("pending"),
  v.literal("indexing"),
  v.literal("complete"),
  v.literal("error"),
);

export const evaluationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("error"),
);

export const evalFixStatusValidator = v.union(
  v.literal("fixing"),
  v.literal("fix_completed"),
  v.literal("fix_error"),
);

export const themeValidator = v.union(v.literal("light"), v.literal("dark"));

export const auditSeverityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

export const evalResultValidator = v.object({
  requirement: v.string(),
  passed: v.boolean(),
  detail: v.string(),
  severity: v.optional(auditSeverityValidator),
});

export const auditSectionValidator = v.object({
  name: v.string(),
  results: v.array(evalResultValidator),
});

export const userFlowValidator = v.object({
  name: v.string(),
  steps: v.array(v.string()),
});

export const notificationTypeValidator = v.union(
  v.literal("routine_complete"),
  v.literal("export_ready"),
  v.literal("task_complete"),
  v.literal("task_assigned"),
  v.literal("comment_added"),
  v.literal("run_completed"),
  v.literal("rate_limit"),
  v.literal("system"),
);

export const errorTypeValidator = v.union(
  v.literal("rate_limit"),
  v.literal("generic"),
);

export const deploymentStatusValidator = v.union(
  v.literal("queued"),
  v.literal("building"),
  v.literal("deployed"),
  v.literal("error"),
);

export const roleUserValidator = v.union(
  v.literal("business"),
  v.literal("dev"),
  v.literal("designer"),
);

/** Hardcoded preset prompts mapped to each user role. These only affect response style and communication tone — they must NOT influence what code edits are made. */
export const PERSONALISATION_PRESETS = {
  business: {
    label: "Business",
    description: "Non-technical, outcome-focused communication",
    prompt:
      "When explaining your work, use non-technical language. Frame responses around business outcomes, user impact, and timelines rather than implementation details. Avoid code snippets in explanations unless explicitly asked. This only affects how you communicate — make the same code edits you normally would.",
  },
  dev: {
    label: "Developer",
    description: "Technical, code-focused communication",
    prompt:
      "When explaining your work, be technically precise. Include code snippets, reference specific functions, and discuss architecture and performance tradeoffs in your responses. This only affects how you communicate — make the same code edits you normally would.",
  },
  designer: {
    label: "Designer",
    description: "Design-aware communication style",
    prompt:
      "When explaining your work, frame responses in terms of user experience, visual consistency, accessibility, and design patterns. Reference how changes affect the UI and design system in your explanations. This only affects how you communicate — make the same code edits you normally would.",
  },
} as const;

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
  v.literal("codex:gpt-5.4"),
  v.literal("codex:gpt-5.4-mini"),
  v.literal("codex:gpt-5.3-codex"),
  v.literal("codex:gpt-5.2-codex"),
  v.literal("opencode:openai/gpt-5-codex"),
  v.literal("opencode:openai/gpt-5.2"),
  v.literal("opencode:openai/gpt-5.3-codex"),
  v.literal("opencode:openai/gpt-5.4"),
  v.literal("opencode:openai/gpt-5.4-mini"),
  v.literal("cursor:claude-4-sonnet"),
  v.literal("cursor:claude-4.6-sonnet-medium"),
  v.literal("cursor:claude-4.5-opus-high"),
  v.literal("cursor:gpt-5.4-high"),
  v.literal("cursor:gpt-5.4-mini-high"),
  v.literal("cursor:gemini-3.1-pro"),
  v.literal("cursor:composer-2"),
  v.literal("cursor:composer-2-fast"),
);

export type AIProvider = "claude" | "codex" | "opencode" | "cursor";
export type LegacyClaudeModel = "opus" | "sonnet" | "haiku";
export type AIModel =
  | "claude:opus"
  | "claude:sonnet"
  | "claude:haiku"
  | "claude:opusplan"
  | "claude:claude-opus-4-5-20251101"
  | "claude:claude-opus-4-6"
  | "codex:gpt-5.4"
  | "codex:gpt-5.4-mini"
  | "codex:gpt-5.3-codex"
  | "codex:gpt-5.2-codex"
  | "opencode:openai/gpt-5-codex"
  | "opencode:openai/gpt-5.2"
  | "opencode:openai/gpt-5.3-codex"
  | "opencode:openai/gpt-5.4"
  | "opencode:openai/gpt-5.4-mini"
  | "cursor:claude-4-sonnet"
  | "cursor:claude-4.6-sonnet-medium"
  | "cursor:claude-4.5-opus-high"
  | "cursor:gpt-5.4-high"
  | "cursor:gpt-5.4-mini-high"
  | "cursor:gemini-3.1-pro"
  | "cursor:composer-2"
  | "cursor:composer-2-fast";
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
    id: "cursor:claude-4-sonnet",
    provider: "cursor",
    label: "Claude 4 Sonnet",
    requiresAuth: true,
  },
  {
    id: "cursor:claude-4.6-sonnet-medium",
    provider: "cursor",
    label: "Claude 4.6 Sonnet",
    requiresAuth: true,
  },
  {
    id: "cursor:claude-4.5-opus-high",
    provider: "cursor",
    label: "Claude 4.5 Opus",
    requiresAuth: true,
  },
  {
    id: "cursor:gpt-5.4-high",
    provider: "cursor",
    label: "GPT-5.4",
    requiresAuth: true,
  },
  {
    id: "cursor:gpt-5.4-mini-high",
    provider: "cursor",
    label: "GPT-5.4 mini",
    requiresAuth: true,
  },
  {
    id: "cursor:gemini-3.1-pro",
    provider: "cursor",
    label: "Gemini 3 Pro",
    requiresAuth: true,
  },
  {
    id: "cursor:composer-2",
    provider: "cursor",
    label: "Composer 2",
    requiresAuth: true,
  },
  {
    id: "cursor:composer-2-fast",
    provider: "cursor",
    label: "Composer 2 Fast",
    requiresAuth: true,
  },
];

export const CLAUDE_MODELS: ReadonlyArray<AIModel> = [
  "claude:opus",
  "claude:sonnet",
  "claude:haiku",
  "claude:opusplan",
  "claude:claude-opus-4-5-20251101",
];
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
    case "cursor:claude-4-sonnet":
      return "cursor:claude-4-sonnet";
    case "cursor:claude-4.6-sonnet-medium":
      return "cursor:claude-4.6-sonnet-medium";
    case "cursor:claude-4.5-opus-high":
      return "cursor:claude-4.5-opus-high";
    case "cursor:gpt-5.4-high":
      return "cursor:gpt-5.4-high";
    case "cursor:gpt-5.4-mini-high":
      return "cursor:gpt-5.4-mini-high";
    case "cursor:gemini-3.1-pro":
      return "cursor:gemini-3.1-pro";
    case "cursor:composer-2":
      return "cursor:composer-2";
    case "cursor:composer-2-fast":
      return "cursor:composer-2-fast";
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

export const snapshotScheduleValidator = v.string();

export const snapshotBuildStatusValidator = v.union(
  v.literal("running"),
  v.literal("success"),
  v.literal("error"),
);

export const snapshotBuildTriggerValidator = v.union(
  v.literal("cron"),
  v.literal("manual"),
);

export const snapshotWarmupStatusValidator = v.union(
  v.literal("pending"),
  v.literal("success"),
  v.literal("error"),
);

export const teamMemberRoleValidator = v.union(
  v.literal("owner"),
  v.literal("member"),
);

export const runModeValidator = v.union(
  v.literal("implementation"),
  v.literal("resolve_conflicts"),
);

export const activityLogTypeValidator = v.union(
  v.literal("run"),
  v.literal("audit"),
  v.literal("fix"),
);

export const webhookEventStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("skipped"),
);

export const variationValidator = v.object({
  label: v.string(),
  route: v.optional(v.string()),
  filePath: v.optional(v.string()),
});

export const accentColorValidator = v.union(
  v.literal("teal"),
  v.literal("blue"),
  v.literal("purple"),
  v.literal("rose"),
  v.literal("orange"),
  v.literal("green"),
  v.literal("amber"),
  v.literal("cyan"),
  v.literal("pink"),
  v.literal("indigo"),
  v.literal("red"),
);

export const radiusValidator = v.union(
  v.literal("none"),
  v.literal("sm"),
  v.literal("md"),
  v.literal("lg"),
  v.literal("xl"),
  v.literal("full"),
);

export const fontFamilyValidator = v.union(
  v.literal("inter"),
  v.literal("roboto"),
  v.literal("poppins"),
  v.literal("dm-sans"),
  v.literal("space-grotesk"),
  v.literal("geist"),
  v.literal("source-serif"),
  v.literal("jakarta"),
  v.literal("outfit"),
  v.literal("nunito"),
  v.literal("ibm-plex"),
  v.literal("figtree"),
);

export const letterSpacingValidator = v.union(
  v.literal("tighter"),
  v.literal("tight"),
  v.literal("normal"),
  v.literal("wide"),
  v.literal("wider"),
);

export const customThemeValidator = v.object({
  accentColor: v.optional(accentColorValidator),
  radius: v.optional(radiusValidator),
  fontFamily: v.optional(fontFamilyValidator),
  letterSpacing: v.optional(letterSpacingValidator),
});

export const logEntryValidator = v.object({
  timestamp: v.number(),
  level: logLevelValidator,
  message: v.string(),
});

export const agentTaskFields = {
  title: v.string(),
  description: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
  projectId: v.optional(v.id("projects")),
  tags: v.optional(v.array(v.string())),
  taskNumber: v.optional(v.number()),
  status: taskStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
  lastRunAt: v.optional(v.number()),
  createdBy: v.optional(v.id("users")),
  assignedTo: v.optional(v.id("users")),
  model: v.optional(aiModelValidator),
  baseBranch: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  scheduledRetryAt: v.optional(v.number()),
  scheduledAt: v.optional(v.number()),
  scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
};

export const agentRunFields = {
  taskId: v.id("agentTasks"),
  status: runStatusValidator,
  logs: v.array(logEntryValidator),
  startedAt: v.optional(v.number()),
  finishedAt: v.optional(v.number()),
  finalizingAt: v.optional(v.number()),
  resultSummary: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  error: v.optional(v.string()),
  errorType: v.optional(errorTypeValidator),
  limitResetAt: v.optional(v.number()),
  exitReason: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
  deploymentStatus: v.optional(deploymentStatusValidator),
  deploymentUrl: v.optional(v.string()),
  mode: v.optional(runModeValidator),
};

export const sessionFields = {
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  branchName: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
  ptySessionId: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
  status: sessionStatusValidator,
  archived: v.optional(v.boolean()),
  summary: v.optional(v.array(v.string())),
  createdBy: v.optional(v.id("users")),
  planContent: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
  deploymentStatus: v.optional(deploymentStatusValidator),
  deploymentUrl: v.optional(v.string()),
};

export const syncSettingFields = {
  owner: v.string(),
  name: v.string(),
  enabled: v.boolean(),
};

export const githubRepoFields = {
  owner: v.string(),
  name: v.string(),
  installationId: v.number(),
  githubId: v.optional(v.number()),
  connected: v.optional(v.boolean()),
  connectedBy: v.optional(v.id("users")),
  teamId: v.optional(v.id("teams")),
  rootDirectory: v.optional(v.string()),
  parentRepoId: v.optional(v.id("githubRepos")),
  defaultBaseBranch: v.optional(v.string()),
  defaultModel: v.optional(aiModelValidator),
  sessionsVncEnabled: v.optional(v.boolean()),
  sessionsVscodeEnabled: v.optional(v.boolean()),
  hidden: v.optional(v.boolean()),
  deploymentProjectName: v.optional(v.string()),
  domains: v.optional(v.array(v.string())),
  mcpRootPrompt: v.optional(v.string()),
  screenshotsVideosEnabled: v.optional(v.boolean()),
};

export const conversationMessageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
});

export const projectFields = {
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  branchName: v.optional(v.string()),
  baseBranch: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
  lastSandboxActivity: v.optional(v.number()),
  phase: phaseValidator,
  rawInput: v.string(),
  projectLead: v.optional(v.id("users")),
  members: v.optional(v.array(v.id("users"))),
  projectStartDate: v.optional(v.number()),
  projectEndDate: v.optional(v.number()),
  activeWorkflowId: v.optional(v.string()),
  activeBuildWorkflowId: v.optional(v.string()),
  scheduledBuildAt: v.optional(v.number()),
  scheduledBuildFunctionId: v.optional(v.id("_scheduled_functions")),
  lastBuildError: v.optional(v.string()),
  branchVersion: v.optional(v.number()),
};

export const projectDetailsFields = {
  projectId: v.id("projects"),
  conversationHistory: v.array(conversationMessageValidator),
  generatedSpec: v.optional(v.string()),
};

export const findingSeverityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

export const automationFindingValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  severity: findingSeverityValidator,
  filePaths: v.optional(v.array(v.string())),
  suggestedFix: v.optional(v.string()),
  taskId: v.optional(v.id("agentTasks")),
});

export const automationFields = {
  repoId: v.id("githubRepos"),
  title: v.string(),
  description: v.string(),
  cronSchedule: v.string(),
  model: v.optional(aiModelValidator),
  enabled: v.boolean(),
  readOnly: v.optional(v.boolean()),
  actionsEnabled: v.optional(v.boolean()),
  cronJobId: v.optional(v.string()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const automationRunFields = {
  automationId: v.id("automations"),
  repoId: v.id("githubRepos"),
  status: runStatusValidator,
  startedAt: v.number(),
  finishedAt: v.optional(v.number()),
  resultSummary: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  error: v.optional(v.string()),
  acknowledged: v.boolean(),
  sandboxId: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  activityLog: v.optional(v.string()),
  findings: v.optional(v.array(automationFindingValidator)),
};

export const messageFields = {
  role: roleValidator,
  content: v.string(),
  timestamp: v.number(),
  finishedAt: v.optional(v.number()),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  parentId: v.union(v.id("sessions"), v.id("designSessions")),
  mode: v.optional(sessionModeValidator),
  isSystemAlert: v.optional(v.boolean()),
  errorDetail: v.optional(v.string()),
  personaId: v.optional(v.id("designPersonas")),
  variations: v.optional(v.array(variationValidator)),
  imageStorageId: v.optional(v.id("_storage")),
  videoStorageId: v.optional(v.id("_storage")),
  pendingQuestion: v.optional(v.string()),
};

export const queuedMessageFields = {
  parentId: v.union(v.id("sessions"), v.id("designSessions")),
  content: v.string(),
  createdAt: v.number(),
  userId: v.id("users"),
  mode: v.optional(sessionModeValidator),
  model: v.optional(aiModelValidator),
  responseLength: v.optional(v.string()),
  personaId: v.optional(v.id("designPersonas")),
  numDesigns: v.optional(v.number()),
};
