import {
  mutation,
  QueryCtx,
  MutationCtx,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  themeValidator,
  roleUserValidator,
  customThemeValidator,
} from "./validators";
import { authQuery, authMutation } from "./functions";

/** Resolves the current authenticated user's ID from their Clerk identity, or returns null if unauthenticated. */
export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const clerkUserId = identity.subject;
  if (!clerkUserId) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
    .first();

  if (user) {
    return user._id;
  }
  return null;
}

/** Returns the Clerk ID for a given user, or null if the user doesn't exist. */
export const getUserClerkId = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.clerkId ?? null;
  },
});

/** Looks up a full user document by their Clerk ID. */
export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
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
      lastSeenAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user ?? null;
  },
});

/** Thin wrapper around getCurrentUserId for use as a function reference in actions. */
export const getUserIdFromIdentity = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getCurrentUserId(ctx);
  },
});

/** Returns the authenticated user's ID. */
export const me = authQuery({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    return ctx.userId;
  },
});

/** Creates a new user record if one doesn't exist for the current Clerk identity, or returns the existing one. */
export const ensureUserExists = mutation({
  args: {},
  returns: v.object({
    userId: v.id("users"),
    wasCreated: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkUserId = identity.subject;
    const email = identity.email || "";

    if (!clerkUserId) {
      throw new Error("Clerk user ID is required");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
      .first();

    if (existingUser) {
      return {
        userId: existingUser._id,
        wasCreated: false,
      };
    }

    if (process.env.ENVIRONMENT === "production") {
      throw new Error(
        "Sign-ups are disabled on this deployment. Please self-host Eva to create your own instance.",
      );
    }

    const userId = await ctx.db.insert("users", {
      clerkId: clerkUserId,
      email: email || undefined,
      firstName:
        typeof identity.firstName === "string" ? identity.firstName : undefined,
      lastName:
        typeof identity.lastName === "string" ? identity.lastName : undefined,
      fullName: typeof identity.name === "string" ? identity.name : undefined,
    });

    return {
      userId,
      wasCreated: true,
    };
  },
});

/** Returns the current user's selected theme preference. */
export const getTheme = authQuery({
  args: {},
  returns: v.union(themeValidator, v.null()),
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    return user?.theme ?? null;
  },
});

/** Updates the current user's theme preference. */
export const setTheme = authMutation({
  args: { theme: themeValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.userId, { theme: args.theme });
    return null;
  },
});

/** Returns the current user's custom theme configuration. */
export const getCustomTheme = authQuery({
  args: {},
  returns: v.union(customThemeValidator, v.null()),
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    return user?.customTheme ?? null;
  },
});

/** Updates the current user's custom theme configuration. */
export const setCustomTheme = authMutation({
  args: { customTheme: customThemeValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.userId, { customTheme: args.customTheme });
    return null;
  },
});

/** Returns whether the toolbar is visible for the current user. */
export const getToolbarVisible = authQuery({
  args: {},
  returns: v.union(v.boolean(), v.null()),
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    return user?.toolbarVisible ?? null;
  },
});

/** Toggles the toolbar visibility preference for the current user. */
export const setToolbarVisible = authMutation({
  args: { visible: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.userId, { toolbarVisible: args.visible });
    return null;
  },
});
