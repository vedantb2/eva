import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    xp: v.optional(v.number()),
    streak: v.optional(v.number()),
    lastPracticeDate: v.optional(v.string()),
    hearts: v.optional(v.number()),
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
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_status", ["projectId", "status"]),

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
    branchName: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
    featureId: v.optional(v.id("features")),
    taskNumber: v.optional(v.number()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("code_review"),
      v.literal("done")
    ),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_board", ["boardId"])
    .index("by_column", ["columnId"])
    .index("by_feature", ["featureId"])
    .index("by_feature_and_status", ["featureId", "status"]),

  agentRuns: defineTable({
    taskId: v.id("agentTasks"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("success"),
      v.literal("error")
    ),
    logs: v.array(
      v.object({
        timestamp: v.number(),
        level: v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
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

  plans: defineTable({
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    title: v.string(),
    rawInput: v.string(),
    generatedSpec: v.optional(v.string()),
    codebaseIndex: v.optional(v.string()),
    indexingStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("indexing"),
        v.literal("complete"),
        v.literal("error")
      )
    ),
    state: v.union(
      v.literal("draft"),
      v.literal("finalized"),
      v.literal("feature_created")
    ),
    conversationHistory: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"])
    .index("by_repo_and_state", ["repoId", "state"]),

  features: defineTable({
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    planId: v.optional(v.id("plans")),
    title: v.string(),
    description: v.optional(v.string()),
    branchName: v.string(),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
  })
    .index("by_repo", ["repoId"])
    .index("by_user", ["userId"])
    .index("by_repo_and_status", ["repoId", "status"])
    .index("by_plan", ["planId"]),

  taskDependencies: defineTable({
    taskId: v.id("agentTasks"),
    dependsOnId: v.id("agentTasks"),
  })
    .index("by_task", ["taskId"])
    .index("by_dependency", ["dependsOnId"]),
});

export default schema;
