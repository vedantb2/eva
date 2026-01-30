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
  indexingStatusValidator,
  evaluationStatusValidator,
  themeValidator,
  requirementMetValidator,
  requirementNotMetValidator,
  notificationTypeValidator,
  roleUserValidator,
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
    prUrl: v.optional(v.string()),
    sandboxId: v.optional(v.string()),
    lastSandboxActivity: v.optional(v.number()),
    phase: phaseValidator,
    rawInput: v.string(),
    generatedSpec: v.optional(v.string()),
    codebaseIndex: v.optional(v.string()),
    indexingStatus: v.optional(indexingStatusValidator),
    conversationHistory: v.array(
      v.object({
        role: roleValidator,
        content: v.string(),
      })
    ),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"])
    .index("by_repo_and_phase", ["repoId", "phase"]),

  boards: defineTable({
    name: v.string(),
    ownerId: v.string(),
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
    taskNumber: v.optional(v.number()),
    status: taskStatusValidator,
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    sessionId: v.optional(v.id("sessions")),
  })
    .index("by_board", ["boardId"])
    .index("by_column", ["columnId"])
    .index("by_project", ["projectId"])
    .index("by_project_and_status", ["projectId", "status"])
    .index("by_session", ["sessionId"]),

  agentRuns: defineTable({
    taskId: v.id("agentTasks"),
    status: runStatusValidator,
    logs: v.array(
      v.object({
        timestamp: v.number(),
        level: logLevelValidator,
        message: v.string(),
      })
    ),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    resultSummary: v.optional(v.string()),
    prUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_task", ["taskId"]),

  githubRepos: defineTable({
    owner: v.string(),
    name: v.string(),
    installationId: v.number(),
  }).index("by_owner_name", ["owner", "name"]),

  subtasks: defineTable({
    parentTaskId: v.id("agentTasks"),
    title: v.string(),
    completed: v.boolean(),
    order: v.number(),
  }).index("by_parent", ["parentTaskId"]),

  taskComments: defineTable({
    taskId: v.id("agentTasks"),
    content: v.string(),
    authorId: v.string(),
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),

  taskProof: defineTable({
    taskId: v.id("agentTasks"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
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
    lastActivityAt: v.optional(v.number()),
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
      })
    ),
    fileDiffs: v.optional(v.array(v.object({
      file: v.string(),
      status: v.string(),
      diff: v.string(),
    }))),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"])
    .index("by_repo_and_status", ["repoId", "status"]),
  docs: defineTable({
    repoId: v.id("githubRepos"),
    title: v.string(),
    content: v.string(),
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
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"]),
  savedQueries: defineTable({
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
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
    requirementsMet: v.array(requirementMetValidator),
    requirementsNotMet: v.array(requirementNotMetValidator),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_doc", ["docId"]),
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
});

export default schema;
