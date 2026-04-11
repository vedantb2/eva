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

/** Checks if a user has access to a repo — either as the connector or via team membership. */
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

/** Checks if a user can access a task by verifying access to its parent repo or project. */
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

/** Recalculates a project's phase (active/completed) based on the statuses of its tasks. */
export async function recomputeProjectPhase(
  db: GenericDatabaseWriter<DataModel>,
  projectId: Id<"projects">,
): Promise<void> {
  const project = await db.get(projectId);
  if (!project) return;
  if (
    project.phase !== "active" &&
    project.phase !== "completed" &&
    project.phase !== "finalized" &&
    project.phase !== "cancelled"
  )
    return;

  const activeStatuses = ["todo", "in_progress", "business_review"] as const;
  const activeChecks = await Promise.all(
    activeStatuses.map((status) =>
      db
        .query("agentTasks")
        .withIndex("by_project_and_status", (q) =>
          q.eq("projectId", projectId).eq("status", status),
        )
        .first(),
    ),
  );
  const anyActive = activeChecks.some((t) => t !== null);

  if (anyActive) {
    if (project.phase !== "active") {
      await db.patch(projectId, { phase: "active" });
    }
    return;
  }

  const nonDoneStatuses = ["code_review", "draft", "cancelled"] as const;
  const nonDoneChecks = await Promise.all(
    nonDoneStatuses.map((status) =>
      db
        .query("agentTasks")
        .withIndex("by_project_and_status", (q) =>
          q.eq("projectId", projectId).eq("status", status),
        )
        .first(),
    ),
  );
  const hasNonDone = nonDoneChecks.some((t) => t !== null);

  const hasDone = await db
    .query("agentTasks")
    .withIndex("by_project_and_status", (q) =>
      q.eq("projectId", projectId).eq("status", "done"),
    )
    .first();

  if (!hasDone && !hasNonDone) return;

  const allDone = hasDone !== null && !hasNonDone && !anyActive;
  if (allDone && project.phase !== "completed") {
    await db.patch(projectId, { phase: "completed" });
  }
}

/** Fetches a project by ID, throwing if not found or the user lacks access. */
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

/** Returns true if the given task has any queued or running agent runs. */
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

/** Determines if this is the first task on a branch (no prior successful runs or no PR yet). */
export async function isFirstTaskOnBranch(
  db: GenericDatabaseReader<DataModel>,
  taskId: Id<"agentTasks">,
  projectId?: Id<"projects">,
): Promise<boolean> {
  if (projectId) {
    const project = await db.get(projectId);
    if (project?.prUrl) return false;
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

/** Deletes a task and all its related data (runs, dependencies, scheduled functions). */
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
  await ctx.db.delete(taskId);
}

/** Authenticated query wrapper — injects userId into context, throws if not authenticated. */
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

/** Authenticated mutation wrapper — injects userId into context, throws if not authenticated. */
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

/** Resolves the authenticated user's ID from within an action context by running a query. */
async function resolveActionUserId(ctx: ActionCtx): Promise<Id<"users">> {
  const userId = await ctx.runQuery(getUserIdFromIdentityRef);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/** Authenticated action wrapper — injects userId into context via a query roundtrip. */
export const authAction = customAction(
  action,
  customCtx(async (ctx: ActionCtx) => {
    const userId = await resolveActionUserId(ctx);
    return { userId };
  }),
);

/** Internal authenticated query — same as authQuery but for internal-only queries. */
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

/** Internal authenticated mutation — same as authMutation but for internal-only mutations. */
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

/** Internal authenticated action — same as authAction but for internal-only actions. */
export const internalAuthAction = customAction(
  internalAction,
  customCtx(async (ctx: ActionCtx) => {
    const userId = await resolveActionUserId(ctx);
    return { userId };
  }),
);
