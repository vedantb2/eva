import {
  customCtx,
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";
import type { GenericDatabaseReader } from "convex/server";
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
import type { Id, Doc } from "./_generated/dataModel";

export async function getAccessibleBoards(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
): Promise<Doc<"boards">[]> {
  const ownedBoards = await db
    .query("boards")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .collect();
  const teamMemberships = await db
    .query("teamMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const teamIds = new Set(teamMemberships.map((m) => m.teamId));
  if (teamIds.size === 0) return ownedBoards;
  const ownedBoardIds = new Set(ownedBoards.map((b) => b._id));
  const teamBoards: Doc<"boards">[] = [];
  for (const teamId of teamIds) {
    const repos = await db
      .query("githubRepos")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
    for (const repo of repos) {
      if (repo.connectedBy === userId) continue;
      const boards = await db
        .query("boards")
        .withIndex("by_repo", (q) => q.eq("repoId", repo._id))
        .collect();
      for (const board of boards) {
        if (!ownedBoardIds.has(board._id)) {
          teamBoards.push(board);
        }
      }
    }
  }
  return [...ownedBoards, ...teamBoards];
}

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

export async function hasBoardAccess(
  db: GenericDatabaseReader<DataModel>,
  board: Doc<"boards">,
  userId: Id<"users">,
): Promise<boolean> {
  if (board.ownerId === userId) return true;
  const repoId = board.repoId;
  if (!repoId) return false;
  return hasRepoAccess(db, repoId, userId);
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
