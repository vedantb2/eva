import { v } from "convex/values";

export const workflowCompleteValidator = v.object({
  success: v.boolean(),
  result: v.union(v.string(), v.null()),
  error: v.union(v.string(), v.null()),
  activityLog: v.union(v.string(), v.null()),
});

export const taskStatusValidator = v.union(
  v.literal("draft"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("business_review"),
  v.literal("code_review"),
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
  v.literal("execute"),
  v.literal("ask"),
  v.literal("plan"),
  v.literal("flag"),
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

export const evalResultValidator = v.object({
  requirement: v.string(),
  passed: v.boolean(),
  detail: v.string(),
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
);

export const claudeModelValidator = v.union(
  v.literal("opus"),
  v.literal("sonnet"),
  v.literal("haiku"),
);

export const CLAUDE_MODELS = ["opus", "sonnet", "haiku"] as const;
export type ClaudeModel = (typeof CLAUDE_MODELS)[number];

export const queryConfirmationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled"),
);

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

export const teamMemberRoleValidator = v.union(
  v.literal("owner"),
  v.literal("member"),
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
);

export const fontFamilyValidator = v.union(
  v.literal("inter"),
  v.literal("roboto"),
  v.literal("poppins"),
  v.literal("dm-sans"),
  v.literal("space-grotesk"),
  v.literal("geist"),
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
  createdBy: v.optional(v.id("users")),
  assignedTo: v.optional(v.id("users")),
  model: v.optional(claudeModelValidator),
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
  defaultModel: v.optional(claudeModelValidator),
  sessionsVncEnabled: v.optional(v.boolean()),
  sessionsVscodeEnabled: v.optional(v.boolean()),
  hidden: v.optional(v.boolean()),
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
  deadline: v.optional(v.number()),
  activeWorkflowId: v.optional(v.string()),
  activeBuildWorkflowId: v.optional(v.string()),
  scheduledBuildAt: v.optional(v.number()),
  scheduledBuildFunctionId: v.optional(v.id("_scheduled_functions")),
};

export const projectDetailsFields = {
  projectId: v.id("projects"),
  conversationHistory: v.array(conversationMessageValidator),
  generatedSpec: v.optional(v.string()),
};

export const messageFields = {
  role: roleValidator,
  content: v.string(),
  timestamp: v.number(),
  finishedAt: v.optional(v.number()),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  parentId: v.union(
    v.id("sessions"),
    v.id("designSessions"),
    v.id("researchQueries"),
  ),
  mode: v.optional(sessionModeValidator),
  isSystemAlert: v.optional(v.boolean()),
  errorDetail: v.optional(v.string()),
  personaId: v.optional(v.id("designPersonas")),
  variations: v.optional(v.array(variationValidator)),
  queryCode: v.optional(v.string()),
  status: v.optional(queryConfirmationStatusValidator),
  imageStorageId: v.optional(v.id("_storage")),
  videoStorageId: v.optional(v.id("_storage")),
};
