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
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { getCurrentUserId } from "./auth";
import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";

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
  const anyActive = tasks.some(
    (t) =>
      t.status === "todo" ||
      t.status === "in_progress" ||
      t.status === "code_review",
  );
  if (allDone && project.phase !== "completed") {
    await db.patch(projectId, { phase: "completed" });
  } else if (anyActive && project.phase === "completed") {
    await db.patch(projectId, { phase: "active" });
  } else if (anyActive && project.phase === "finalized") {
    await db.patch(projectId, { phase: "active" });
  }
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

export const authAction = customAction(
  action,
  customCtx(async (ctx): Promise<{ userId: Id<"users"> }> => {
    const userId = await ctx.runQuery(internal.auth.getUserIdFromIdentity, {});
    if (!userId) {
      throw new Error("Not authenticated");
    }
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
  customCtx(async (ctx): Promise<{ userId: Id<"users"> }> => {
    const userId = await ctx.runQuery(internal.auth.getUserIdFromIdentity, {});
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return { userId };
  }),
);
