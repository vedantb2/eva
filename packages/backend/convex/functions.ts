import {
  customCtx,
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";
import type {
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import { makeFunctionReference } from "convex/server";
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import { getCurrentUserId } from "./auth";
import type { DataModel, Doc, Id } from "./_generated/dataModel";

export async function hasRepoAccess(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
  userId: Id<"users">,
): Promise<boolean> {
  const repo = await db.get(repoId);
  if (!repo) return false;
  if (repo.connectedBy === userId) return true;
  const teamId = repo.teamId;
  if (!teamId) return false;
  const membership = await db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userId", userId),
    )
    .first();
  return membership !== null;
}

export async function hasTaskAccess(
  db: GenericDatabaseReader<DataModel>,
  task: { repoId?: Id<"githubRepos">; projectId?: Id<"projects"> },
  userId: Id<"users">,
): Promise<boolean> {
  if (task.repoId) return hasRepoAccess(db, task.repoId, userId);
  if (task.projectId) {
    const project = await db.get(task.projectId);
    return project ? hasRepoAccess(db, project.repoId, userId) : false;
  }
  return false;
}

export async function recomputeProjectPhase(
  db: GenericDatabaseWriter<DataModel>,
  projectId: Id<"projects">,
): Promise<void> {
  const project = await db.get(projectId);
  if (!project) return;
  if (
    project.phase !== "active" &&
    project.phase !== "completed" &&
    project.phase !== "finalized"
  )
    return;
  const tasks = await db
    .query("agentTasks")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  if (tasks.length === 0) return;
  const allDone = tasks.every((t) => t.status === "done");
  // code_review is intentionally excluded: tasks awaiting review are not
  // considered "active work" and don't block the project from completing.
  const anyActive = tasks.some(
    (t) =>
      t.status === "todo" ||
      t.status === "in_progress" ||
      t.status === "business_review",
  );
  if (allDone && project.phase !== "completed") {
    await db.patch(projectId, { phase: "completed" });
  } else if (anyActive && project.phase === "completed") {
    await db.patch(projectId, { phase: "active" });
  } else if (anyActive && project.phase === "finalized") {
    await db.patch(projectId, { phase: "active" });
  }
}

export async function getProjectWithAccess(
  db: GenericDatabaseReader<DataModel>,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<Doc<"projects">> {
  const project = await db.get(projectId);
  if (!project) throw new Error("Project not found");
  if (!(await hasRepoAccess(db, project.repoId, userId))) {
    throw new Error("Not authorized");
  }
  return project;
}

export async function hasActiveRun(
  db: GenericDatabaseReader<DataModel>,
  taskId: Id<"agentTasks">,
): Promise<boolean> {
  const queued = await db
    .query("agentRuns")
    .withIndex("by_task_and_status", (q) =>
      q.eq("taskId", taskId).eq("status", "queued"),
    )
    .first();
  if (queued) return true;
  const running = await db
    .query("agentRuns")
    .withIndex("by_task_and_status", (q) =>
      q.eq("taskId", taskId).eq("status", "running"),
    )
    .first();
  return running !== null;
}

export async function isFirstTaskOnBranch(
  db: GenericDatabaseReader<DataModel>,
  taskId: Id<"agentTasks">,
  projectId?: Id<"projects">,
): Promise<boolean> {
  if (projectId) {
    const projectTasks = await db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const pt of projectTasks) {
      const successRun = await db
        .query("agentRuns")
        .withIndex("by_task_and_status", (q) =>
          q.eq("taskId", pt._id).eq("status", "success"),
        )
        .first();
      if (successRun) return false;
    }
    return true;
  }
  const successRun = await db
    .query("agentRuns")
    .withIndex("by_task_and_status", (q) =>
      q.eq("taskId", taskId).eq("status", "success"),
    )
    .first();
  return successRun === null;
}

export async function deleteTaskRelatedData(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
): Promise<void> {
  const task = await ctx.db.get(taskId);
  if (task?.scheduledFunctionId) {
    try {
      await ctx.scheduler.cancel(task.scheduledFunctionId);
    } catch {
      // may have already fired
    }
  }
  const runs = await ctx.db
    .query("agentRuns")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const run of runs) {
    await ctx.db.delete(run._id);
  }
  const dependencies = await ctx.db
    .query("taskDependencies")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const dep of dependencies) {
    await ctx.db.delete(dep._id);
  }
  const dependents = await ctx.db
    .query("taskDependencies")
    .withIndex("by_dependency", (q) => q.eq("dependsOnId", taskId))
    .collect();
  for (const dep of dependents) {
    await ctx.db.delete(dep._id);
  }
  const subtasks = await ctx.db
    .query("subtasks")
    .withIndex("by_parent", (q) => q.eq("parentTaskId", taskId))
    .collect();
  for (const subtask of subtasks) {
    await ctx.db.delete(subtask._id);
  }
  await ctx.db.delete(taskId);
}

export const authQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return { userId };
  }),
);

export const authMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return { userId };
  }),
);

const getUserIdFromIdentityRef = makeFunctionReference<
  "query",
  Record<string, never>,
  Id<"users"> | null
>("auth:getUserIdFromIdentity");

async function resolveActionUserId(ctx: ActionCtx): Promise<Id<"users">> {
  const userId = await ctx.runQuery(getUserIdFromIdentityRef);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export const authAction = customAction(
  action,
  customCtx(async (ctx: ActionCtx) => {
    const userId = await resolveActionUserId(ctx);
    return { userId };
  }),
);

export const internalAuthQuery = customQuery(
  internalQuery,
  customCtx(async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return { userId };
  }),
);

export const internalAuthMutation = customMutation(
  internalMutation,
  customCtx(async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return { userId };
  }),
);

export const internalAuthAction = customAction(
  internalAction,
  customCtx(async (ctx: ActionCtx) => {
    const userId = await resolveActionUserId(ctx);
    return { userId };
  }),
);
