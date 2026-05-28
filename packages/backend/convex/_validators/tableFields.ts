import { v } from "convex/values";
import { aiModelValidator } from "./aiModels";
import {
  deploymentStatusValidator,
  errorTypeValidator,
  phaseValidator,
  priorityValidator,
  roleValidator,
  runModeValidator,
  runStatusValidator,
  sessionModeValidator,
  sessionStatusValidator,
  taskActivityFieldValidator,
  taskSandboxEventValidator,
  taskSandboxStatusValidator,
  taskStatusValidator,
} from "./enums";
import {
  automationFindingValidator,
  conversationMessageValidator,
  logEntryValidator,
  terminalPaneValidator,
  variationValidator,
} from "./shapes";

export const agentTaskFields = {
  title: v.string(),
  description: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
  projectId: v.optional(v.id("projects")),
  tags: v.optional(v.array(v.string())),
  taskNumber: v.optional(v.number()),
  status: taskStatusValidator,
  priority: v.optional(priorityValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.id("users")),
  assignedTo: v.optional(v.id("users")),
  model: v.optional(aiModelValidator),
  baseBranch: v.optional(v.string()),
  // Per-task override for the repo-level `screenshotsVideosEnabled` setting.
  // undefined = inherit repo. true = force on. false = force off. Resolved at
  // run time in `_taskWorkflow/queries.ts` (`getTaskData`) where the agent
  // prompt and sandbox env var are computed.
  screenshotsVideosEnabled: v.optional(v.boolean()),
  activeWorkflowId: v.optional(v.string()),
  scheduledRetryAt: v.optional(v.number()),
  scheduledAt: v.optional(v.number()),
  scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
  // Canonical sandbox shared across run/preview/resolve_conflicts. Persists
  // across the task lifecycle so reviewers can resume in-sandbox state (DB,
  // generated fixtures) instead of re-bootstrapping from the branch.
  sandboxId: v.optional(v.string()),
  // Separate from `activeWorkflowId` so a task can host an in-sandbox chat
  // (via the sandbox view) concurrently with — and without conflicting with —
  // its main run workflow.
  activeChatWorkflowId: v.optional(v.string()),
  // UI state for the reviewer-facing Start/Stop sandbox button.
  reviewTaskSandboxStatus: v.optional(taskSandboxStatusValidator),
  // Resolved dev server port + full command for the current sandbox. Stored
  // so the task panel can route the preview iframe to the right port and
  // auto-run the dev server in the first terminal pane. Populated by
  // taskSandboxReady from startSessionServices() output.
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
  terminalPanes: v.optional(v.array(terminalPaneValidator)),
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
  prError: v.optional(v.string()),
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
  prState: v.optional(
    v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("merged"),
      v.literal("closed"),
    ),
  ),
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
  terminalPanes: v.optional(v.array(terminalPaneValidator)),
  deploymentStatus: v.optional(deploymentStatusValidator),
  deploymentUrl: v.optional(v.string()),
};

export const syncSettingFields = {
  owner: v.string(),
  name: v.string(),
  enabled: v.boolean(),
};

export const repoSkillFields = {
  repoId: v.id("githubRepos"),
  title: v.string(),
  description: v.optional(v.string()),
  /** Full SKILL.md body from the last successful GitHub sync. */
  content: v.optional(v.string()),
  sourcePath: v.optional(v.string()),
  sourceSha: v.optional(v.string()),
  available: v.optional(v.boolean()),
  lastSyncedAt: v.optional(v.number()),
  unavailableSince: v.optional(v.number()),
  prompt: v.optional(v.string()),
  createdAt: v.number(),
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
  auditReviewModel: v.optional(aiModelValidator),
  auditFixModel: v.optional(aiModelValidator),
  proofModel: v.optional(aiModelValidator),
  sessionsVncEnabled: v.optional(v.boolean()),
  sessionsVscodeEnabled: v.optional(v.boolean()),
  hidden: v.optional(v.boolean()),
  deploymentProjectName: v.optional(v.string()),
  domains: v.optional(v.array(v.string())),
  mcpRootPrompt: v.optional(v.string()),
  screenshotsVideosEnabled: v.optional(v.boolean()),
  startupCommands: v.optional(v.array(v.string())),
  backgroundCommands: v.optional(v.array(v.string())),
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
  systemPrompt: v.optional(v.string()),
};

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
  // UI state for the project-level Start/Stop preview sandbox button.
  // Mirrors `agentTasks.reviewTaskSandboxStatus` lifecycle.
  reviewProjectSandboxStatus: v.optional(taskSandboxStatusValidator),
  // Dev port + full command for the active project preview sandbox.
  // Populated by `projectSandboxReady` from `startSessionServices` output.
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
  terminalPanes: v.optional(v.array(terminalPaneValidator)),
  phase: phaseValidator,
  /** How the project was created: AI interview/plan vs tasks-only container. */
  planningMode: v.optional(
    v.union(v.literal("interview"), v.literal("tasks_only")),
  ),
  priority: v.optional(priorityValidator),
  rawInput: v.string(),
  projectLead: v.optional(v.id("users")),
  members: v.optional(v.array(v.id("users"))),
  projectStartDate: v.optional(v.number()),
  projectEndDate: v.optional(v.number()),
  activeWorkflowId: v.optional(v.string()),
  activeBuildWorkflowId: v.optional(v.string()),
  // Separate from build + spec workflows so the in-sandbox chat can run
  // independently of the project's other lifecycle workflows.
  activeChatWorkflowId: v.optional(v.string()),
  scheduledBuildAt: v.optional(v.number()),
  scheduledBuildFunctionId: v.optional(v.id("_scheduled_functions")),
  lastBuildError: v.optional(v.string()),
  branchVersion: v.optional(v.number()),
  // Set when chat or other queue helpers touch the project. Mirrors
  // `sessions.updatedAt` so the same queue/list helpers work uniformly.
  updatedAt: v.optional(v.number()),
};

export const projectDetailsFields = {
  projectId: v.id("projects"),
  conversationHistory: v.array(conversationMessageValidator),
  generatedSpec: v.optional(v.string()),
};

export const automationFields = {
  repoId: v.id("githubRepos"),
  title: v.string(),
  description: v.string(),
  cronSchedule: v.string(),
  model: v.optional(aiModelValidator),
  enabled: v.boolean(),
  readOnly: v.optional(v.boolean()),
  actionsEnabled: v.optional(v.boolean()),
  shared: v.optional(v.boolean()),
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
  parentId: v.union(
    v.id("sessions"),
    v.id("designSessions"),
    v.id("projects"),
    v.id("agentTasks"),
  ),
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
  parentId: v.union(
    v.id("sessions"),
    v.id("designSessions"),
    v.id("projects"),
    v.id("agentTasks"),
  ),
  content: v.string(),
  createdAt: v.number(),
  userId: v.id("users"),
  mode: v.optional(sessionModeValidator),
  model: v.optional(aiModelValidator),
  responseLength: v.optional(v.string()),
  personaId: v.optional(v.id("designPersonas")),
  numDesigns: v.optional(v.number()),
};

export const taskSandboxEventFields = {
  taskId: v.id("agentTasks"),
  event: taskSandboxEventValidator,
  errorDetail: v.optional(v.string()),
  createdAt: v.number(),
};

export const taskActivityFields = {
  taskId: v.id("agentTasks"),
  field: taskActivityFieldValidator,
  oldValue: v.optional(v.string()),
  newValue: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  createdAt: v.number(),
};

export const taskCommentFields = {
  taskId: v.id("agentTasks"),
  content: v.string(),
  authorId: v.optional(v.id("users")),
  parentId: v.optional(v.id("taskComments")),
  deletedAt: v.optional(v.number()),
  createdAt: v.number(),
};

// Per-sandbox bearer secret the in-sandbox git credential helper presents to
// /api/git-credentials to receive a freshly minted GitHub App installation
// token. One row per Daytona sandbox; rotated every time the helper is
// reinstalled.
export const sandboxGitCredentialsFields = {
  sandboxId: v.string(),
  installationId: v.number(),
  secret: v.string(),
  createdAt: v.number(),
};
