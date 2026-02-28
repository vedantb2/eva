import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  taskStatusValidator,
  runStatusValidator,
  logLevelValidator,
  roleValidator,
  sessionModeValidator,
  sessionStatusValidator,
  phaseValidator,
  evaluationStatusValidator,
  themeValidator,
  evalResultValidator,
  userFlowValidator,
  notificationTypeValidator,
  roleUserValidator,
  queryConfirmationStatusValidator,
  claudeModelValidator,
  errorTypeValidator,
  snapshotScheduleValidator,
  snapshotBuildStatusValidator,
  snapshotBuildTriggerValidator,
  teamMemberRoleValidator,
} from "./validators";

const schema = defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    role: v.optional(roleUserValidator),
    theme: v.optional(themeValidator),
    toolbarVisible: v.optional(v.boolean()),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  userMigrations: defineTable({
    clerkUserId: v.string(),
    userId: v.id("users"),
    email: v.string(),
    migratedAt: v.number(),
    migrationStatus: v.union(v.literal("started"), v.literal("completed")),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),

  projects: defineTable({
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
    generatedSpec: v.optional(v.string()),
    conversationHistory: v.array(
      v.object({
        role: roleValidator,
        content: v.string(),
        activityLog: v.optional(v.string()),
        userId: v.optional(v.id("users")),
      }),
    ),
    projectLead: v.optional(v.id("users")),
    members: v.optional(v.array(v.id("users"))),
    projectStartDate: v.optional(v.number()),
    projectEndDate: v.optional(v.number()),
    deadline: v.optional(v.number()),
    activeWorkflowId: v.optional(v.string()),
    activeBuildWorkflowId: v.optional(v.string()),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"])
    .index("by_repo_and_phase", ["repoId", "phase"]),

  boards: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    repoId: v.optional(v.id("githubRepos")),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_repo", ["repoId"]),

  columns: defineTable({
    boardId: v.id("boards"),
    name: v.string(),
    order: v.number(),
    isRunColumn: v.optional(v.boolean()),
  }).index("by_board", ["boardId"]),

  agentTasks: defineTable({
    boardId: v.id("boards"),
    columnId: v.id("columns"),
    title: v.string(),
    description: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
    projectId: v.optional(v.id("projects")),
    tags: v.optional(v.array(v.string())),
    taskNumber: v.optional(v.number()),
    status: taskStatusValidator,
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    model: v.optional(claudeModelValidator),
    baseBranch: v.optional(v.string()),
    activeWorkflowId: v.optional(v.string()),
    scheduledRetryAt: v.optional(v.number()),
  })
    .index("by_board", ["boardId"])
    .index("by_column", ["columnId"])
    .index("by_project", ["projectId"])
    .index("by_project_and_status", ["projectId", "status"]),

  agentRuns: defineTable({
    taskId: v.id("agentTasks"),
    status: runStatusValidator,
    logs: v.array(
      v.object({
        timestamp: v.number(),
        level: logLevelValidator,
        message: v.string(),
      }),
    ),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    resultSummary: v.optional(v.string()),
    prUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    errorType: v.optional(errorTypeValidator),
    limitResetAt: v.optional(v.number()),
    activityLog: v.optional(v.string()),
  }).index("by_task", ["taskId"]),

  githubRepos: defineTable({
    owner: v.string(),
    name: v.string(),
    installationId: v.number(),
    connected: v.optional(v.boolean()),
    connectedBy: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
  })
    .index("by_owner_name", ["owner", "name"])
    .index("by_team", ["teamId"]),

  subtasks: defineTable({
    parentTaskId: v.id("agentTasks"),
    title: v.string(),
    completed: v.boolean(),
    order: v.number(),
  }).index("by_parent", ["parentTaskId"]),

  taskComments: defineTable({
    taskId: v.id("agentTasks"),
    content: v.string(),
    authorId: v.id("users"),
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),

  taskProof: defineTable({
    taskId: v.id("agentTasks"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    runId: v.optional(v.id("agentRuns")),
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),

  taskDependencies: defineTable({
    taskId: v.id("agentTasks"),
    dependsOnId: v.id("agentTasks"),
  })
    .index("by_task", ["taskId"])
    .index("by_dependency", ["dependsOnId"]),
  sessions: defineTable({
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
    messages: v.array(
      v.object({
        role: roleValidator,
        content: v.string(),
        timestamp: v.number(),
        mode: v.optional(sessionModeValidator),
        activityLog: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        isSystemAlert: v.optional(v.boolean()),
        errorDetail: v.optional(v.string()),
      }),
    ),
    planContent: v.optional(v.string()),
    activeWorkflowId: v.optional(v.string()),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"])
    .index("by_repo_and_status", ["repoId", "status"]),
  streamingActivity: defineTable({
    entityId: v.string(),
    currentActivity: v.string(),
  }).index("by_entity", ["entityId"]),
  docs: defineTable({
    repoId: v.id("githubRepos"),
    title: v.string(),
    content: v.string(),
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
    activeWorkflowId: v.optional(v.string()),
    testGenStatus: v.optional(evaluationStatusValidator),
    testPrUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_repo", ["repoId"]),
  researchQueries: defineTable({
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    title: v.string(),
    messages: v.array(
      v.object({
        role: roleValidator,
        content: v.string(),
        timestamp: v.number(),
        userId: v.optional(v.id("users")),
        queryCode: v.optional(v.string()),
        status: v.optional(queryConfirmationStatusValidator),
        activityLog: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
    activeWorkflowId: v.optional(v.string()),
    sandboxId: v.optional(v.string()),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"]),
  savedQueries: defineTable({
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    researchQueryId: v.optional(v.id("researchQueries")),
    title: v.string(),
    query: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"]),
  routines: defineTable({
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    query: v.string(),
    schedule: v.optional(v.string()),
    lastRunAt: v.optional(v.number()),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"]),
  annotations: defineTable({
    userId: v.id("users"),
    pageUrl: v.string(),
    pins: v.string(),
    updatedAt: v.number(),
  }).index("by_user_and_url", ["userId", "pageUrl"]),

  evaluationReports: defineTable({
    repoId: v.id("githubRepos"),
    docId: v.id("docs"),
    status: evaluationStatusValidator,
    results: v.array(evalResultValidator),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    activeWorkflowId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
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
    messages: v.array(
      v.object({
        role: roleValidator,
        content: v.string(),
        timestamp: v.number(),
        activityLog: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        personaId: v.optional(v.id("designPersonas")),
        variations: v.optional(
          v.array(
            v.object({
              label: v.string(),
              route: v.optional(v.string()),
              filePath: v.optional(v.string()),
            }),
          ),
        ),
      }),
    ),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"]),
  taskAudits: defineTable({
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
    status: evaluationStatusValidator,
    accessibility: v.array(evalResultValidator),
    testing: v.array(evalResultValidator),
    codeReview: v.array(evalResultValidator),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_run", ["runId"]),
  sessionAudits: defineTable({
    sessionId: v.id("sessions"),
    status: evaluationStatusValidator,
    accessibility: v.array(evalResultValidator),
    testing: v.array(evalResultValidator),
    codeReview: v.array(evalResultValidator),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),
  notifications: defineTable({
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.optional(v.string()),
    read: v.boolean(),
    href: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"]),
  repoEnvVars: defineTable({
    repoId: v.id("githubRepos"),
    vars: v.array(v.object({ key: v.string(), value: v.string() })),
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
    cronJobId: v.optional(v.string()),
    workflowRef: v.optional(v.string()),
    customSetupCommands: v.array(v.string()),
    customEnvVars: v.array(
      v.object({
        key: v.string(),
        value: v.string(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_repoId", ["repoId"]),
  snapshotBuilds: defineTable({
    repoSnapshotId: v.id("repoSnapshots"),
    status: snapshotBuildStatusValidator,
    triggeredBy: snapshotBuildTriggerValidator,
    logs: v.string(),
    error: v.optional(v.string()),
    workflowRunId: v.optional(v.number()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_repoSnapshotId", ["repoSnapshotId"])
    .index("by_status", ["status"]),
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
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),
  teamEnvVars: defineTable({
    teamId: v.id("teams"),
    vars: v.array(v.object({ key: v.string(), value: v.string() })),
    updatedAt: v.number(),
  }).index("by_team", ["teamId"]),
});

export default schema;
