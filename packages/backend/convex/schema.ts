import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  activityLogTypeValidator,
  sessionStatusValidator,
  evaluationStatusValidator,
  evalFixStatusValidator,
  auditSectionValidator,
  notificationTypeValidator,
  snapshotScheduleValidator,
  snapshotBuildStatusValidator,
  snapshotBuildTriggerValidator,
  seededAppResultValidator,
  snapshotWarmupStatusValidator,
  teamMemberRoleValidator,
  webhookEventStatusValidator,
  messageFields,
  automationFields,
  automationRunFields,
  agentTaskFields,
  agentRunFields,
  sessionFields,
  githubRepoFields,
  syncSettingFields,
  projectFields,
  projectDetailsFields,
  queuedMessageFields,
  taskSandboxEventFields,
  taskActivityFields,
  taskCommentFields,
  taskReactionFields,
  taskSubscriberFields,
  repoSkillFields,
  sandboxGitCredentialsFields,
  appSettingsFields,
  userFields,
  docFields,
  docCommentFields,
  docSubscriberFields,
  docVersionFields,
  docVersionDraftFields,
  draftFields,
  evaluationReportFields,
  artifactFields,
} from "./validators";

const schema = defineSchema({
  users: defineTable(userFields)
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  artifacts: defineTable(artifactFields)
    .index("by_team", ["boundTeamId"])
    .index("by_uploader", ["uploadedBy"]),

  projects: defineTable(projectFields)
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"])
    .index("by_repo_and_phase", ["repoId", "phase"])
    .index("by_pr_url", ["prUrl"]),

  projectDetails: defineTable(projectDetailsFields).index("by_project", [
    "projectId",
  ]),

  agentTasks: defineTable(agentTaskFields)
    .index("by_repo", ["repoId"])
    .index("by_repo_and_status", ["repoId", "status"])
    .index("by_repo_and_updatedAt", ["repoId", "updatedAt"])
    .index("by_project", ["projectId"])
    .index("by_project_and_status", ["projectId", "status"]),

  agentRuns: defineTable(agentRunFields)
    .index("by_task", ["taskId"])
    .index("by_task_and_status", ["taskId", "status"])
    .index("by_status", ["status"])
    .index("by_pr_url", ["prUrl"]),

  agentRunActivityLogs: defineTable({
    runId: v.id("agentRuns"),
    activityLog: v.string(),
    type: v.optional(activityLogTypeValidator),
    updatedAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_run_and_type", ["runId", "type"]),

  githubRepos: defineTable(githubRepoFields)
    .index("by_github_id", ["githubId"])
    .index("by_owner_and_name", ["owner", "name"])
    .index("by_team", ["teamId"])
    .index("by_connected_by", ["connectedBy"]),

  taskComments: defineTable(taskCommentFields).index("by_task", ["taskId"]),

  taskReactions: defineTable(taskReactionFields)
    .index("by_task", ["taskId"])
    .index("by_target_user_emoji", [
      "targetType",
      "targetId",
      "userId",
      "emoji",
    ]),

  taskSubscribers: defineTable(taskSubscriberFields)
    .index("by_task", ["taskId"])
    .index("by_task_and_user", ["taskId", "userId"]),

  taskProof: defineTable({
    taskId: v.id("agentTasks"),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    message: v.optional(v.string()),
    runId: v.optional(v.id("agentRuns")),
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),

  taskDependencies: defineTable({
    taskId: v.id("agentTasks"),
    dependsOnId: v.id("agentTasks"),
  })
    .index("by_task", ["taskId"])
    .index("by_task_and_depends_on", ["taskId", "dependsOnId"])
    .index("by_dependency", ["dependsOnId"]),
  taskSandboxEvents: defineTable(taskSandboxEventFields).index("by_task", [
    "taskId",
  ]),
  taskActivity: defineTable(taskActivityFields).index("by_task", ["taskId"]),
  messages: defineTable(messageFields).index("by_parent", ["parentId"]),
  queuedMessages: defineTable(queuedMessageFields).index(
    "by_parent_and_created",
    ["parentId", "createdAt"],
  ),
  sessions: defineTable(sessionFields)
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"])
    .index("by_repo_and_status", ["repoId", "status"])
    .index("by_repo_and_archived", ["repoId", "archived"])
    .index("by_pr_url", ["prUrl"]),
  streamingActivity: defineTable({
    entityId: v.string(),
    currentActivity: v.string(),
    currentContent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
    lastUpdatedAt: v.optional(v.number()),
  }).index("by_entity", ["entityId"]),
  docs: defineTable(docFields)
    .index("by_repo", ["repoId"])
    .index("by_session", ["sessionId"])
    .index("by_repo_and_pr_url", ["repoId", "prUrl"]),

  docComments: defineTable(docCommentFields).index("by_doc", ["docId"]),

  docSubscribers: defineTable(docSubscriberFields)
    .index("by_doc", ["docId"])
    .index("by_doc_and_user", ["docId", "userId"]),

  docVersions: defineTable(docVersionFields).index("by_doc", ["docId"]),

  docVersionDrafts: defineTable(docVersionDraftFields).index("by_doc", [
    "docId",
  ]),
  annotations: defineTable({
    userId: v.id("users"),
    pageUrl: v.string(),
    pins: v.string(),
    updatedAt: v.number(),
  }).index("by_user_and_url", ["userId", "pageUrl"]),

  evaluationReports: defineTable(evaluationReportFields)
    .index("by_repo", ["repoId"])
    .index("by_doc", ["docId"]),
  designPersonas: defineTable({
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    name: v.string(),
    prompt: v.string(),
  }).index("by_repo", ["repoId"]),
  designSessions: defineTable({
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    title: v.string(),
    status: sessionStatusValidator,
    sandboxId: v.optional(v.string()),
    branchName: v.optional(v.string()),
    activeWorkflowId: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    selectedVariationIndex: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    devPort: v.optional(v.number()),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"]),
  auditCategories: defineTable({
    repoId: v.id("githubRepos"),
    name: v.string(),
    description: v.string(),
    enabled: v.boolean(),
    appId: v.optional(v.id("githubRepos")),
    disabledForAppIds: v.optional(v.array(v.id("githubRepos"))),
    createdAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_repo_and_enabled", ["repoId", "enabled"]),
  repoSkills: defineTable(repoSkillFields)
    .index("by_repo", ["repoId"])
    .index("by_repo_and_source_path", ["repoId", "sourcePath"]),
  audits: defineTable({
    entityId: v.union(v.id("agentTasks"), v.id("sessions")),
    runId: v.optional(v.id("agentRuns")),
    status: evaluationStatusValidator,
    sections: v.optional(v.array(auditSectionValidator)),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    fixStatus: v.optional(evalFixStatusValidator),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    fixCompletedAt: v.optional(v.number()),
  })
    .index("by_entity", ["entityId"])
    .index("by_entity_created", ["entityId", "createdAt"]),
  notifications: defineTable({
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.optional(v.string()),
    read: v.boolean(),
    href: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
    createdAt: v.number(),
    // Human-readable task/project context shown on the notification card, e.g.
    // a quick task's title or "Project title: issue title" for project tasks.
    // Only set for types whose title does not already name the task (mentions,
    // comment replies); snapshotted at creation, absent otherwise.
    contextLabel: v.optional(v.string()),
    // Set once this notification has been included in an email (instant send or
    // daily digest), so neither path emails the same notification twice.
    emailedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"])
    .index("by_repo", ["repoId"]),
  repoEnvVars: defineTable({
    repoId: v.id("githubRepos"),
    vars: v.array(
      v.object({
        key: v.string(),
        value: v.string(),
        sandboxExclude: v.optional(v.boolean()),
      }),
    ),
    updatedAt: v.number(),
  }).index("by_repo", ["repoId"]),
  extensionReleases: defineTable({
    version: v.string(),
    crxStorageId: v.id("_storage"),
    releasedAt: v.number(),
    notes: v.optional(v.string()),
  }).index("by_version", ["version"]),
  repoSnapshots: defineTable({
    repoId: v.id("githubRepos"),
    snapshotName: v.string(),
    schedule: snapshotScheduleValidator,
    enabled: v.optional(v.boolean()),
    cronJobId: v.optional(v.string()),
    workflowRef: v.optional(v.string()),
    buildCommands: v.optional(v.array(v.string())),
    // Fingerprint of the image inputs (lockfile sha on the build branch,
    // buildCommands, config-file blobs, image definition version) stored at the
    // last successful Image build. When unchanged, the build workflow skips the
    // ~11-15m image rebuild — its output would be byte-identical.
    imageFingerprint: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_repo", ["repoId"]),
  snapshotBuilds: defineTable({
    repoSnapshotId: v.id("repoSnapshots"),
    status: snapshotBuildStatusValidator,
    triggeredBy: snapshotBuildTriggerValidator,
    logs: v.string(),
    error: v.optional(v.string()),
    workflowRunId: v.optional(v.number()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    retryCount: v.optional(v.number()),
    warmupStatus: v.optional(snapshotWarmupStatusValidator),
    warmupError: v.optional(v.string()),
    // Per-app seeding outcomes captured during Step 5 of the build workflow.
    seededApps: v.optional(v.array(seededAppResultValidator)),
  })
    .index("by_repo_snapshot", ["repoSnapshotId"])
    .index("by_repo_snapshot_and_status", ["repoSnapshotId", "status"])
    .index("by_status", ["status"]),
  sandboxConfigFiles: defineTable({
    repoId: v.id("githubRepos"),
    // Legacy single-blob storage (kept for backwards compat with existing records).
    // New uploads always use `chunks` instead.
    storageId: v.optional(v.id("_storage")),
    // Ordered list of storage blob IDs that, when concatenated in order, form the file.
    // Single-blob files use a 1-element array; multi-chunk files split a large file by ~100MB.
    chunks: v.optional(v.array(v.id("_storage"))),
    fileName: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_repo", ["repoId"]),
  teams: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    isPersonal: v.optional(v.boolean()),
  }).index("by_created_by", ["createdBy"]),
  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: teamMemberRoleValidator,
    joinedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_role", ["teamId", "role"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),
  githubWebhookEvents: defineTable({
    event: v.string(),
    action: v.string(),
    prUrl: v.optional(v.string()),
    merged: v.optional(v.boolean()),
    taskId: v.optional(v.id("agentTasks")),
    status: webhookEventStatusValidator,
    createdAt: v.number(),
  }).index("by_status", ["status"]),
  teamEnvVars: defineTable({
    teamId: v.id("teams"),
    vars: v.array(
      v.object({
        key: v.string(),
        value: v.string(),
        sandboxExclude: v.optional(v.boolean()),
      }),
    ),
    updatedAt: v.number(),
  }).index("by_team", ["teamId"]),
  automations: defineTable(automationFields)
    .index("by_repo", ["repoId"])
    .index("by_repo_and_enabled", ["repoId", "enabled"]),

  automationRuns: defineTable(automationRunFields)
    .index("by_automation", ["automationId"])
    .index("by_automation_and_status", ["automationId", "status"])
    .index("by_repo", ["repoId"]),

  logs: defineTable({
    entityType: v.string(),
    entityId: v.string(),
    entityTitle: v.string(),
    rawResultEvent: v.optional(v.string()),
    repoId: v.id("githubRepos"),
    projectId: v.optional(v.id("projects")),
    createdAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_repo_and_created", ["repoId", "createdAt"])
    .index("by_entity_type", ["entityType"])
    .index("by_repo_and_entity", ["repoId", "entityId"])
    .index("by_project", ["projectId"]),

  syncSettings: defineTable(syncSettingFields).index("by_owner_and_name", [
    "owner",
    "name",
  ]),

  mcpAuthCodes: defineTable({
    code: v.string(),
    clerkUserId: v.string(),
    codeChallenge: v.string(),
    codeChallengeMethod: v.string(),
    redirectUri: v.string(),
    clientId: v.string(),
    expiresAt: v.number(),
  }).index("by_code", ["code"]),

  mcpClientRegistrations: defineTable({
    clientId: v.string(),
    clientSecret: v.optional(v.string()),
    redirectUris: v.array(v.string()),
    registeredAt: v.number(),
  }).index("by_clientId", ["clientId"]),

  sandboxGitCredentials: defineTable(sandboxGitCredentialsFields)
    .index("by_sandbox_id", ["sandboxId"])
    .index("by_secret", ["secret"]),

  // App-wide singleton settings (only ever one row). Read/written via the
  // helpers in `sandboxAutoStop.ts`.
  appSettings: defineTable(appSettingsFields),

  // One row per (user, surface target). Persists unsent composer text for task
  // comments and chat prompts so drafts survive page reloads.
  drafts: defineTable(draftFields)
    .index("by_user_and_task", ["userId", "taskId"])
    .index("by_user_and_session", ["userId", "sessionId"])
    .index("by_user_and_designSession", ["userId", "designSessionId"])
    .index("by_user_and_repo", ["userId", "repoId"]),
});

export default schema;
