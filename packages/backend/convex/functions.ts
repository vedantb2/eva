import {
  customCtx,
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";
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
import type { Id } from "./_generated/dataModel";

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
