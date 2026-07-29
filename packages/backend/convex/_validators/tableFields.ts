import { v } from "convex/values";
import {
  aiModelValidator,
  aiProviderValidator,
  reasoningLevelValidator,
} from "./aiModels";
import {
  backgroundProcessStatusValidator,
  deploymentStatusValidator,
  docKindValidator,
  docVersionSourceValidator,
  errorTypeValidator,
  evaluationStatusValidator,
  evalFixStatusValidator,
  phaseValidator,
  prRecapOriginValidator,
  prRecapStatusValidator,
  priorityValidator,
  reactionTargetValidator,
  roleUserValidator,
  roleValidator,
  runModeValidator,
  runStatusValidator,
  sessionModeValidator,
  sessionStatusValidator,
  taskActivityFieldValidator,
  taskSandboxEventValidator,
  taskSandboxStatusValidator,
  taskStatusValidator,
  themeValidator,
} from "./enums";
import {
  automationFindingValidator,
  conversationMessageValidator,
  customThemeValidator,
  evalIssueValidator,
  logEntryValidator,
  terminalPaneValidator,
  userFlowValidator,
  variationValidator,
} from "./shapes";

export const userFields = {
  clerkId: v.optional(v.string()),
  email: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  fullName: v.optional(v.string()),
  isAdmin: v.optional(v.boolean()),
  role: v.optional(roleUserValidator),
  theme: v.optional(themeValidator),
  customTheme: v.optional(customThemeValidator),
  toolbarVisible: v.optional(v.boolean()),
  customInstructions: v.optional(v.string()),
  lastSeenAt: v.optional(v.number()),
  lastSeenPath: v.optional(v.string()),
  lastChangelogDismissedAt: v.optional(v.number()),
  onboardingCompletedAt: v.optional(v.number()),
  emailNotificationsEnabled: v.optional(v.boolean()),
};

// A user's own coding-agent login ("bring your own account"). Each row is one
// account for one provider (e.g. a personal Claude Code OAuth token, a Cursor
// API key). `credentials` holds the provider's auth env vars with values
// encrypted at rest (see `encryption.ts`); the plaintext is only decrypted at
// sandbox-launch time to override the shared team credential, so the user's own
// usage bills to their account. Selected per session/task in the model picker.
export const userProviderAccountFields = {
  userId: v.id("users"),
  provider: aiProviderValidator,
  label: v.string(),
  // Optional hex accent (e.g. "#2563eb") for the account's dot in the picker.
  accentColor: v.optional(v.string()),
  credentials: v.array(v.object({ key: v.string(), value: v.string() })),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const repoEntityTypeValidator = v.union(
  v.literal("sessions"),
  v.literal("docs"),
  v.literal("projects"),
  v.literal("agentTasks"),
  v.literal("designSessions"),
  v.literal("automations"),
);

export const repoEntityCounterFields = {
  repoId: v.id("githubRepos"),
  entityType: repoEntityTypeValidator,
  nextNumId: v.number(),
};

/** Per-repo sequential id for readable URLs. Optional until backfill completes. */
export const entityNumIdFields = {
  numId: v.optional(v.number()),
  deletedAt: v.optional(v.number()),
};

import type { Infer } from "convex/values";

export const backgroundAgentEntryFields = {
  toolUseId: v.string(),
  taskId: v.optional(v.string()),
  description: v.optional(v.string()),
  status: v.string(),
  backgrounded: v.optional(v.boolean()),
  startedAt: v.number(),
  settledAt: v.optional(v.number()),
};

export const backgroundAgentEntryValidator = v.object(
  backgroundAgentEntryFields,
);

export type BackgroundAgentEntry = Infer<typeof backgroundAgentEntryValidator>;

export const pendingTurnFields = {
  prompt: v.string(),
  requestedAt: v.number(),
  // legacy field, no longer written — cleanup migration later
  turnKind: v.optional(
    v.union(v.literal("conversational"), v.literal("agent")),
  ),
  attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  model: v.optional(aiModelValidator),
};

export const pendingTurnValidator = v.optional(v.object(pendingTurnFields));

export const chatDaemonEntityFields = {
  pendingTurn: pendingTurnValidator,
  syntheticTurnMessageId: v.optional(v.id("messages")),
  backgroundAgents: v.optional(v.array(backgroundAgentEntryValidator)),
  pendingTaskStops: v.optional(v.array(v.string())),
  // Interrupt-cancel signal for a warm Claude daemon: cancelExecution sets this
  // instead of killing the sandbox process; claimPendingTurn drains it
  // unconditionally (even mid-turn, with no pendingTurn) so the daemon's poll
  // loop notices and aborts its in-flight SDK query.
  cancelRequestedAt: v.optional(v.number()),
};

export const agentTaskFields = {
  ...entityNumIdFields,
  title: v.string(),
  description: v.optional(v.string()),
  // User-attached input files (paperclip / paste in the quick task composer),
  // stored via Convex file storage. Materialized into the sandbox as
  // /tmp/eva-attachment-* at launch so the agent can read them.
  attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  repoId: v.optional(v.id("githubRepos")),
  projectId: v.optional(v.id("projects")),
  tags: v.optional(v.array(v.string())),
  taskNumber: v.optional(v.number()),
  status: taskStatusValidator,
  priority: v.optional(priorityValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.id("users"),
  assignedTo: v.optional(v.id("users")),
  model: v.optional(aiModelValidator),
  // The user provider account whose credentials run this task (overriding the
  // team credential). Absent = use the shared team credential. Resolved at
  // launch in `signAndLaunchScript`.
  providerAccountId: v.optional(v.id("userProviderAccounts")),
  baseBranch: v.optional(v.string()),
  // Per-task proof capture. undefined = inherit project -> default (off).
  // true = force on. false = force off. Resolved at run time in
  // `_taskWorkflow/queries.ts` (`getTaskData`) where the agent prompt and
  // sandbox env var are computed.
  screenshotsVideosEnabled: v.optional(v.boolean()),
  // Per-task override for whether an audit runs after a successful run.
  // undefined = inherit project -> default. true = force on. false = force
  // off. Resolved in `getTaskData` (`runAuditEnabled`).
  runAuditEnabled: v.optional(v.boolean()),
  // Per-task-sandbox-chat switches, separate from the run-level proof/audit
  // above. Absent = off. Toggled from the sandbox chat composer options menu;
  // read when a chat turn runs (proof prompt) / completes (audit).
  chatCaptureProofEnabled: v.optional(v.boolean()),
  chatRunAuditEnabled: v.optional(v.boolean()),
  activeWorkflowId: v.optional(v.string()),
  scheduledRetryAt: v.optional(v.number()),
  scheduledAt: v.optional(v.number()),
  scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
  // Canonical sandbox shared across run/preview/resolve_conflicts. Persists
  // across the task lifecycle so reviewers can resume in-sandbox state (DB,
  // generated fixtures) instead of re-bootstrapping from the branch.
  sandboxId: v.optional(v.string()),
  // Vercel sandbox name when SANDBOX_PROVIDER=vercel; prefer for reuse
  vercelSandboxId: v.optional(v.string()),
  // Separate from `activeWorkflowId` so a task can host an in-sandbox chat
  // (via the sandbox view) concurrently with — and without conflicting with —
  // its main run workflow.
  activeChatWorkflowId: v.optional(v.string()),
  // UI state for the reviewer-facing Start/Stop sandbox button.
  reviewTaskSandboxStatus: v.optional(taskSandboxStatusValidator),
  // Resolved dev server port + full command for the current sandbox. Stored
  // so the task panel can route the preview iframe to the right port and
  // auto-run the dev server in the first terminal pane. Populated by
  // taskSandboxReady from startSessionServices() output. User Preview port
  // changes also patch `devPort` (sticky, mirrors sessions).
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
  // Sticky Preview URL path for this task sandbox (e.g. "/dashboard").
  previewPath: v.optional(v.string()),
  // Last ~500 lines of the Preview Console PTY (debounced client writes).
  terminalHistoryTail: v.optional(v.string()),
  terminalPanes: v.optional(v.array(terminalPaneValidator)),
  // The change-request comment that put this task back to "todo" via "Make
  // changes". Project-task change runs start later (Build Project), decoupled
  // from the comment, so the id is parked here and copied onto the run's
  // `triggeringCommentId` when the run is created, then cleared. Lets the
  // timeline label project re-runs "made changes" like quick-task re-runs.
  pendingChangeRequestCommentId: v.optional(v.id("taskComments")),
  ...chatDaemonEntityFields,
  // Last model used in sandbox chat; page-open prewarm matches the composer.
  lastChatModel: v.optional(aiModelValidator),
  // Sticky sandbox-chat traits (mirrors sessions.lastReasoningLevel / …).
  lastReasoningLevel: v.optional(reasoningLevelValidator),
  lastThinkingEnabled: v.optional(v.boolean()),
  lastUse1mContext: v.optional(v.boolean()),
  // Soft UX lock while the agent drives the shared desktop Chrome via
  // browser_lock/browser_unlock MCP tools (mirrors sessions.agentBrowsingAt).
  agentBrowsingAt: v.optional(v.number()),
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
  // Vercel sandbox name when SANDBOX_PROVIDER=vercel; prefer for reuse
  vercelSandboxId: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
  deploymentStatus: v.optional(deploymentStatusValidator),
  deploymentUrl: v.optional(v.string()),
  mode: v.optional(runModeValidator),
  // Who started this run (button click or "Make changes" submit). Absent on
  // runs created before this field existed.
  triggeredBy: v.optional(v.id("users")),
  // The change-request comment that started this run, set only for "Make
  // changes" runs. Lets the timeline link a run to its comment explicitly
  // rather than guessing by timestamp.
  triggeringCommentId: v.optional(v.id("taskComments")),
  // Snapshot of which credential powered this run ("Team" or the account
  // label). Stored at insert so history stays readable if the account is
  // renamed or deleted later.
  credentialSourceLabel: v.optional(v.string()),
  // Snapshot of the model used for this run. Absent on runs created before
  // this field existed.
  model: v.optional(aiModelValidator),
  // Per-run proof/audit override. Set when a run trigger passes an explicit
  // choice (the request-changes composer, default off). Absent = fall back to
  // the task/project default. Resolved in `getTaskData`.
  screenshotsVideosEnabled: v.optional(v.boolean()),
  runAuditEnabled: v.optional(v.boolean()),
};

export const sessionFields = {
  ...entityNumIdFields,
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  branchName: v.optional(v.string()),
  // Base branch this session checks out from and creates its branch off of.
  // Chosen at creation (defaults to the repo default). Persisted so sandbox
  // restarts/restores rebuild the session branch from the same base instead of
  // silently falling back to the repo default.
  baseBranch: v.optional(v.string()),
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
  // Vercel sandbox name when SANDBOX_PROVIDER=vercel; prefer for reuse
  vercelSandboxId: v.optional(v.string()),
  ptySessionId: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
  status: sessionStatusValidator,
  archived: v.optional(v.boolean()),
  summary: v.optional(v.array(v.string())),
  createdBy: v.optional(v.id("users")),
  planContent: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  // The user provider account chosen for this session's runs (overriding the
  // team credential). Session-scoped so the page-open daemon prewarm — which
  // has no per-message context — still injects the right account. Absent = team
  // credential. Set by startExecute from the composer's picker.
  providerAccountId: v.optional(v.id("userProviderAccounts")),
  // Last model the user sent on this session. Page-open prewarm uses this so
  // the warm daemon matches the composer's picker instead of defaulting to sonnet.
  lastModel: v.optional(aiModelValidator),
  // Sticky composer effort for this session (mirrors lastModel). Without this,
  // effort only lived in localStorage and reloads fell back to the model
  // default (Claude → high), silently undoing a Medium pick.
  lastReasoningLevel: v.optional(reasoningLevelValidator),
  // Sticky thinking / 1M context toggles (same contract as lastReasoningLevel).
  lastThinkingEnabled: v.optional(v.boolean()),
  lastUse1mContext: v.optional(v.boolean()),
  // Sticky composer mode (edit / plan). Absent → client default "edit".
  lastMode: v.optional(sessionModeValidator),
  // Sticky Preview URL path for this session (e.g. "/dashboard"). Device
  // viewport stays tab-local; port reuses `devPort` below.
  previewPath: v.optional(v.string()),
  // Last ~500 lines of the Preview Console PTY (debounced client writes). Cap
  // keeps sessions.get reads small; full scrollback stays in sessionStorage.
  terminalHistoryTail: v.optional(v.string()),
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
  terminalPanes: v.optional(v.array(terminalPaneValidator)),
  deploymentStatus: v.optional(deploymentStatusValidator),
  deploymentUrl: v.optional(v.string()),
  // Per-session switches toggled from the chat composer options menu. Absent =
  // off. captureProofEnabled adds a proof-capture section to the agent-turn
  // prompt; runAuditEnabled fires an audit after each successful agent turn.
  captureProofEnabled: v.optional(v.boolean()),
  runAuditEnabled: v.optional(v.boolean()),
  ...chatDaemonEntityFields,
  // Soft UX lock while the agent drives the shared desktop Chrome via
  agentBrowsingAt: v.optional(v.number()),
  // True while a new session's sandbox finishes pulling the latest base branch
  // and reinstalling drifted dependencies, after early-ready already unlocked
  // chat. `claimPendingTurn` withholds the queued first turn until this clears,
  // so the agent never runs against a stale snapshot checkout or baked modules.
  sandboxSetupPending: v.optional(v.boolean()),
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

// Lifecycle of a single app's seeded-snapshot build within Step 5: actively
// seeding, captured successfully, or fell back to the base Image.
export const seededAppStatusValidator = v.union(
  v.literal("running"),
  v.literal("seeded"),
  v.literal("fallback"),
);

// Per-app outcome of a seeded-snapshot build (recorded per snapshotBuild during
// Step 5). status tracks the lifecycle (running while in progress); is optional
// for build records created before the field existed (treat absent as terminal,
// inferred from seededSnapshotName). seededSnapshotName is the captured snapshot
// name on success, or null while running / when it fell back to the base Image.
export const seededAppResultValidator = v.object({
  repoId: v.id("githubRepos"),
  app: v.optional(v.string()),
  status: v.optional(seededAppStatusValidator),
  seededSnapshotName: v.union(v.string(), v.null()),
});

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
  startupCommands: v.optional(v.array(v.string())),
  backgroundCommands: v.optional(v.array(v.string())),
  // Clean-shutdown commands run before snapshotting a seeded sandbox so on-disk
  // volumes (e.g. local Postgres) flush consistently. Used by the seeded-snapshot
  // build stage; not run on normal sandbox starts.
  stopCommands: v.optional(v.array(v.string())),
  // Name of this app's seeded running-sandbox snapshot (filesystem snapshot with
  // the DB already seeded), set by the seeded-snapshot build when it succeeds.
  // Preferred over the base Image snapshot at sandbox-create time for fast starts.
  seededSnapshotName: v.optional(v.string()),
  // Fingerprint of the seed inputs (startup/background/stop commands + config
  // file blobs) captured when seededSnapshotName was built. When unchanged, the
  // build workflow skips re-seeding — the existing snapshot's data is identical
  // and re-capturing it would only contend with the image build.
  seededFingerprint: v.optional(v.string()),
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
  systemPrompt: v.optional(v.string()),
  prRecapsEnabled: v.optional(v.boolean()),
  prRecapModel: v.optional(aiModelValidator),
  // Convex storage id of an uploaded logo image shown next to the repo in repo
  // lists. Per-app (not shared across monorepo siblings). Resolved to a URL by
  // list/listByTeam via ctx.storage.getUrl.
  logoStorageId: v.optional(v.id("_storage")),
  // Optional display name shown in the sidebar / repo lists instead of the
  // GitHub name (or monorepo leaf). Per-app; empty clears back to the default.
  label: v.optional(v.string()),
};

/** Eva team (personal or shared). Logo/background resolve to URLs in list/get. */
export const teamFields = {
  name: v.string(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  isPersonal: v.optional(v.boolean()),
  // Convex storage id of an uploaded team icon. Resolved to a URL by
  // teams.list / teams.get / users.listTeamWithMembers via ctx.storage.getUrl.
  logoStorageId: v.optional(v.id("_storage")),
  // Wide banner image shown behind the app sidebar header for this team's repos.
  backgroundStorageId: v.optional(v.id("_storage")),
};

export const projectFields = {
  ...entityNumIdFields,
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  branchName: v.optional(v.string()),
  baseBranch: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
  // Vercel sandbox name when SANDBOX_PROVIDER=vercel; prefer for reuse
  vercelSandboxId: v.optional(v.string()),
  lastSandboxActivity: v.optional(v.number()),
  // UI state for the project-level Start/Stop preview sandbox button.
  // Mirrors `agentTasks.reviewTaskSandboxStatus` lifecycle.
  reviewProjectSandboxStatus: v.optional(taskSandboxStatusValidator),
  // Dev port + full command for the active project preview sandbox.
  // Populated by `projectSandboxReady` from `startSessionServices` output.
  // User Preview port changes also patch `devPort` (sticky, mirrors sessions).
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
  // Sticky Preview URL path for this project sandbox (e.g. "/dashboard").
  previewPath: v.optional(v.string()),
  // Last ~500 lines of the Preview Console PTY (debounced client writes).
  terminalHistoryTail: v.optional(v.string()),
  terminalPanes: v.optional(v.array(terminalPaneValidator)),
  phase: phaseValidator,
  /** How the project was created: AI interview/plan vs tasks-only container. */
  planningMode: v.optional(
    v.union(v.literal("interview"), v.literal("tasks_only")),
  ),
  priority: v.optional(priorityValidator),
  // Per-project tri-state defaults inherited by member tasks (task override
  // wins). undefined = inherit default (off). Resolved in `getTaskData`.
  screenshotsVideosEnabled: v.optional(v.boolean()),
  runAuditEnabled: v.optional(v.boolean()),
  // Per-project-sandbox-chat switches, separate from the task defaults above.
  // Absent = off. Toggled from the project sandbox chat composer options menu.
  chatCaptureProofEnabled: v.optional(v.boolean()),
  chatRunAuditEnabled: v.optional(v.boolean()),
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
  codeReviewer: v.optional(v.id("users")),
  tags: v.optional(v.array(v.string())),
  model: v.optional(aiModelValidator),
  // Whose credential this project's model preference is tied to (null/absent =
  // team). Mirrors agentTasks.providerAccountId for the project metadata picker.
  providerAccountId: v.optional(v.id("userProviderAccounts")),
  ...chatDaemonEntityFields,
  // Last model used in sandbox chat; page-open prewarm matches the composer.
  lastChatModel: v.optional(aiModelValidator),
  // Sticky sandbox-chat traits (mirrors sessions.lastReasoningLevel / …).
  lastReasoningLevel: v.optional(reasoningLevelValidator),
  lastThinkingEnabled: v.optional(v.boolean()),
  lastUse1mContext: v.optional(v.boolean()),
  // Soft UX lock while the agent drives the shared desktop Chrome via
  // browser_lock/browser_unlock MCP tools (mirrors sessions.agentBrowsingAt).
  agentBrowsingAt: v.optional(v.number()),
};

export const projectDetailsFields = {
  projectId: v.id("projects"),
  conversationHistory: v.array(conversationMessageValidator),
  generatedSpec: v.optional(v.string()),
};

export const automationFields = {
  ...entityNumIdFields,
  repoId: v.id("githubRepos"),
  title: v.string(),
  description: v.string(),
  cronSchedule: v.string(),
  model: v.optional(aiModelValidator),
  enabled: v.boolean(),
  readOnly: v.optional(v.boolean()),
  actionsEnabled: v.optional(v.boolean()),
  shared: v.optional(v.boolean()),
  // When true, a successful run broadcasts its result summary by email to every
  // user with email notifications enabled (see automationEmail.sendAutomationEmail).
  sendEmail: v.optional(v.boolean()),
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
  // Vercel sandbox name when SANDBOX_PROVIDER=vercel; prefer for reuse
  vercelSandboxId: v.optional(v.string()),
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
  // Client-generated id (crypto.randomUUID) set when a user message is sent
  // optimistically. Lets the client dedup its local pending row against the
  // server row once the reactive query delivers it.
  clientId: v.optional(v.string()),
  isSystemAlert: v.optional(v.boolean()),
  errorDetail: v.optional(v.string()),
  personaId: v.optional(v.id("designPersonas")),
  variations: v.optional(v.array(variationValidator)),
  imageStorageId: v.optional(v.id("_storage")),
  videoStorageId: v.optional(v.id("_storage")),
  // Agent-captured proof media (recordings/screenshots), in capture order.
  // Supersedes imageStorageId/videoStorageId, which remain only for
  // pre-migration docs.
  mediaStorageIds: v.optional(v.array(v.id("_storage"))),
  // User-attached input images (pasted/dropped in the composer), stored via
  // Convex file storage. Delivered to the agent as files it can read.
  attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  pendingQuestion: v.optional(v.string()),
  // Convex-side guard only — synthetic continuations are rendered like normal
  // turns; the UI does not read this flag.
  isSyntheticTurn: v.optional(v.boolean()),
  // Snapshot of which credential powered this chat turn ("Team" or the
  // account label). Set on user messages at send/dequeue time.
  credentialSourceLabel: v.optional(v.string()),
  // Model + effort chosen in the composer for this user turn. Snapshotted at
  // send/dequeue so the chat can show a provider icon + tooltip later.
  model: v.optional(aiModelValidator),
  reasoningLevel: v.optional(reasoningLevelValidator),
};

export const queuedMessageFields = {
  parentId: v.union(
    v.id("sessions"),
    v.id("designSessions"),
    v.id("projects"),
    v.id("agentTasks"),
  ),
  content: v.string(),
  /** Compact chat-display text; `content` remains the full agent message. */
  displayContent: v.optional(v.string()),
  createdAt: v.number(),
  // Sort key for queue run order. Enqueue sets Date.now() (appends to the end);
  // the reorder mutation rewrites this to 0-based positions. Optional so the
  // field deploys without a migration; legacy rows without it sort first.
  order: v.optional(v.number()),
  userId: v.id("users"),
  mode: v.optional(sessionModeValidator),
  model: v.optional(aiModelValidator),
  // Carried alongside `model` so a queued message runs on the same user account
  // that was selected when it was enqueued.
  providerAccountId: v.optional(v.id("userProviderAccounts")),
  reasoningLevel: v.optional(reasoningLevelValidator),
  thinkingEnabled: v.optional(v.boolean()),
  use1mContext: v.optional(v.boolean()),
  responseLength: v.optional(v.string()),
  personaId: v.optional(v.id("designPersonas")),
  numDesigns: v.optional(v.number()),
  // Carried from the composer through the queue to the started user message.
  attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
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

// One row per (target, user, emoji). Polymorphic within a task: `targetType`
// + `targetId` identify what is reacted to (a comment or the description).
// `targetId` is a string because it spans tables (commentId vs taskId), and is
// never used with `db.get` — access is always gated by the real `taskId`.
export const taskReactionFields = {
  taskId: v.id("agentTasks"),
  targetType: reactionTargetValidator,
  targetId: v.string(),
  emoji: v.string(),
  userId: v.id("users"),
  createdAt: v.number(),
};

// One row per (task, user). `subscribed: false` is a sticky opt-out tombstone —
// it stops auto-subscribe triggers (commenting, being mentioned) from silently
// re-adding a user who explicitly unsubscribed. Absence of a row = never involved.
export const taskSubscriberFields = {
  taskId: v.id("agentTasks"),
  userId: v.id("users"),
  subscribed: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Per-sandbox bearer secret the in-sandbox git credential helper presents to
// /api/git-credentials to receive a freshly minted GitHub App installation
// token. One row per sandbox; rotated every time the helper is
// reinstalled.
// App-wide singleton settings (a single row). Currently holds the daily
// sandbox auto-stop schedule: a wall-clock time + IANA timezone at which the
// `sandboxAutoStop` cron stops every active sandbox so none are left running
// overnight. `sandboxAutoStopLastRunDate` is the once-per-day dedup guard
// (the local date "YYYY-MM-DD" of the last occurrence that was swept).
export const appSettingsFields = {
  sandboxAutoStopEnabled: v.boolean(),
  sandboxAutoStopTime: v.string(),
  sandboxAutoStopTimeZone: v.string(),
  sandboxAutoStopLastRunDate: v.optional(v.string()),
};

export const sandboxGitCredentialsFields = {
  sandboxId: v.string(),
  installationId: v.number(),
  secret: v.string(),
  createdAt: v.number(),
};

export const docFields = {
  ...entityNumIdFields,
  repoId: v.id("githubRepos"),
  kind: v.optional(docKindValidator),
  sessionId: v.optional(v.id("sessions")),
  title: v.string(),
  content: v.string(),
  // Stored HTML for the doc's HTML tab; rendered read-only in an iframe.
  html: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  prNumber: v.optional(v.number()),
  headSha: v.optional(v.string()),
  prRecapStatus: v.optional(prRecapStatusValidator),
  prRecapOrigin: v.optional(prRecapOriginValidator),
  prRecapError: v.optional(v.string()),
  pendingAgentCommentIds: v.optional(v.array(v.id("docComments"))),
  description: v.optional(v.string()),
  userFlows: v.optional(v.array(userFlowValidator)),
  requirements: v.optional(v.array(v.string())),
  interviewHistory: v.optional(
    v.array(
      v.object({
        role: roleValidator,
        content: v.string(),
        activityLog: v.optional(v.string()),
        userId: v.optional(v.id("users")),
      }),
    ),
  ),
  sandboxId: v.optional(v.string()),
  // Vercel sandbox name when SANDBOX_PROVIDER=vercel; prefer for reuse
  vercelSandboxId: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  testGenStatus: v.optional(evaluationStatusValidator),
  testPrUrl: v.optional(v.string()),
  contentUpdatedAt: v.optional(v.number()),
  lastParsedAt: v.optional(v.number()),
  /** Set on create going forward; optional so legacy docs need no backfill. */
  createdBy: v.optional(v.id("users")),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const designSessionFields = {
  ...entityNumIdFields,
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  status: sessionStatusValidator,
  sandboxId: v.optional(v.string()),
  vercelSandboxId: v.optional(v.string()),
  branchName: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  archived: v.optional(v.boolean()),
  selectedVariationIndex: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  devPort: v.optional(v.number()),
  // Sticky composer prefs (same contract as sessions.*) — design chat used to
  // keep these in localStorage only, so picks were lost across devices.
  providerAccountId: v.optional(v.id("userProviderAccounts")),
  lastModel: v.optional(aiModelValidator),
  lastReasoningLevel: v.optional(reasoningLevelValidator),
  lastThinkingEnabled: v.optional(v.boolean()),
  lastUse1mContext: v.optional(v.boolean()),
};

export const docCommentFields = {
  docId: v.id("docs"),
  content: v.string(),
  authorId: v.optional(v.id("users")),
  parentId: v.optional(v.id("docComments")),
  anchorId: v.optional(v.string()),
  anchorText: v.optional(v.string()),
  resolutionTarget: v.optional(v.union(v.literal("agent"), v.literal("human"))),
  resolvedAt: v.optional(v.number()),
  resolvedBy: v.optional(v.id("users")),
  deletedAt: v.optional(v.number()),
  createdAt: v.number(),
};

export const docSubscriberFields = {
  docId: v.id("docs"),
  userId: v.id("users"),
  subscribed: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const docVersionFields = {
  docId: v.id("docs"),
  title: v.string(),
  content: v.string(),
  pmContent: v.string(),
  authorIds: v.array(v.id("users")),
  headSha: v.optional(v.string()),
  source: v.optional(docVersionSourceValidator),
  createdAt: v.number(),
};

export const docVersionDraftFields = {
  docId: v.id("docs"),
  authorIds: v.array(v.id("users")),
  updatedAt: v.number(),
};

// One row per (user, surface target). `kind` names the input surface so the
// table stays extensible. Exactly one target FK group is set, matching `kind`.
// Content is stored TOKENIZED (@[Label](id)) so mentions survive reload.
export const draftFields = {
  userId: v.id("users"),
  repoId: v.id("githubRepos"),
  kind: v.union(
    v.literal("taskComment"),
    v.literal("taskChat"),
    v.literal("projectChat"),
    v.literal("sessionChat"),
    v.literal("designChat"),
  ),
  taskId: v.optional(v.id("agentTasks")),
  parentCommentId: v.optional(v.id("taskComments")),
  projectId: v.optional(v.id("projects")),
  sessionId: v.optional(v.id("sessions")),
  designSessionId: v.optional(v.id("designSessions")),
  content: v.string(),
  updatedAt: v.number(),
};

export const evaluationReportFields = {
  repoId: v.id("githubRepos"),
  docId: v.id("docs"),
  status: evaluationStatusValidator,
  // Severity-ranked issues flagged against the document.
  issues: v.optional(v.array(evalIssueValidator)),
  summary: v.optional(v.string()),
  error: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  fixStatus: v.optional(evalFixStatusValidator),
  fixBranchName: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  // Branch the evaluation ran against, so an opt-in fix uses the same base.
  branchName: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Discriminated target for get/set — explicit per surface, no field-sniffing.
export const draftTarget = v.union(
  v.object({
    kind: v.literal("taskComment"),
    taskId: v.id("agentTasks"),
    parentCommentId: v.optional(v.id("taskComments")),
  }),
  v.object({
    kind: v.literal("taskChat"),
    taskId: v.id("agentTasks"),
  }),
  v.object({
    kind: v.literal("projectChat"),
    projectId: v.id("projects"),
  }),
  v.object({
    kind: v.literal("sessionChat"),
    sessionId: v.id("sessions"),
  }),
  v.object({
    kind: v.literal("designChat"),
    designSessionId: v.id("designSessions"),
  }),
);

// A hosted Claude "Cowork" artifact: a self-contained HTML page uploaded to eva
// that calls the Eva MCP read-only tools via an in-app bridge. boundTeamId scopes
// listing/visibility only — tool calls target any repo the signed-in user can
// access (enforced per call). declaredTools is advisory metadata parsed from the
// artifact's cowork-artifact-meta header; the runtime read-only whitelist is the
// real gate. New row per upload; manual delete.
export const artifactFields = {
  name: v.string(),
  description: v.optional(v.string()),
  boundTeamId: v.id("teams"),
  declaredTools: v.array(v.string()),
  htmlStorageId: v.id("_storage"),
  uploadedBy: v.id("users"),
  createdAt: v.number(),
};

// A user-defined sandbox tab for an app (a `githubRepos` row). Points at a port
// inside the sandbox, resolved through the same auth proxy as the Preview tab.
// `icon` is a free-text Tabler icon name (e.g. "IconBolt"); unknown names fall
// back to a placeholder at render. `order` sorts tabs within the app's list.
export const appTabFields = {
  repoId: v.id("githubRepos"),
  name: v.string(),
  icon: v.string(),
  port: v.number(),
  enabled: v.boolean(),
  order: v.number(),
};

/**
 * Agent-spawned background Bash process tracked for the session chat panel.
 * `key` is the Bash tool_use id (idempotency for HTTP retries). `pid` is filled
 * by the first successful reconcile match.
 */
export const backgroundProcessFields = {
  sessionId: v.id("sessions"),
  key: v.string(),
  command: v.string(),
  shellId: v.optional(v.string()),
  pid: v.optional(v.number()),
  status: backgroundProcessStatusValidator,
  startedAt: v.number(),
  exitedAt: v.optional(v.number()),
};
