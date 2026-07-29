import {
  mutation,
  type QueryCtx,
  type MutationCtx,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  themeValidator,
  roleUserValidator,
  customThemeValidator,
  userFields,
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

  return user?._id ?? null;
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
      ...userFields,
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

    const firstName =
      typeof identity.firstName === "string" ? identity.firstName : undefined;
    const lastName =
      typeof identity.lastName === "string" ? identity.lastName : undefined;
    const fullName =
      typeof identity.name === "string" ? identity.name : undefined;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
      .first();

    if (existingUser) {
      const needsUpdate =
        existingUser.email !== (email || undefined) ||
        existingUser.firstName !== firstName ||
        existingUser.lastName !== lastName ||
        existingUser.fullName !== fullName;

      if (needsUpdate) {
        await ctx.db.patch(existingUser._id, {
          email: email || undefined,
          firstName,
          lastName,
          fullName,
        });
      }

      return {
        userId: existingUser._id,
        wasCreated: false,
      };
    }

    const userId = await ctx.db.insert("users", {
      clerkId: clerkUserId,
      email: email || undefined,
      firstName,
      lastName,
      fullName,
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

/**
 * Returns whether the current user has opted in to email notifications
 * (daily summary + weekly changelog). Defaults to false (opt-in).
 */
export const getEmailNotificationsEnabled = authQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    return user?.emailNotificationsEnabled ?? false;
  },
});

/** Updates the current user's email notification opt-in preference. */
export const setEmailNotificationsEnabled = authMutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.userId, { emailNotificationsEnabled: args.enabled });
    return null;
  },
});

/**
 * Returns whether Chrome-style session tabs are enabled (replaces the sessions
 * sidebar). Defaults to false (opt-in experimental).
 */
export const getExperimentalSessionTabsEnabled = authQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    return user?.experimentalSessionTabsEnabled ?? false;
  },
});

/** Updates the current user's experimental session-tabs preference. */
export const setExperimentalSessionTabsEnabled = authMutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.userId, {
      experimentalSessionTabsEnabled: args.enabled,
    });
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

/** Returns the current user's personalisation settings (role + custom instructions). */
export const getPersonalisation = authQuery({
  args: {},
  returns: v.object({
    role: v.union(roleUserValidator, v.null()),
    customInstructions: v.union(v.string(), v.null()),
  }),
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    return {
      role: user?.role ?? null,
      customInstructions: user?.customInstructions ?? null,
    };
  },
});

/** Updates the current user's custom instructions. */
export const setCustomInstructions = authMutation({
  args: { customInstructions: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.userId, {
      customInstructions: args.customInstructions || undefined,
    });
    return null;
  },
});

/** Updates the current user's functional role preset. */
export const setRole = authMutation({
  args: { role: v.union(roleUserValidator, v.null()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.userId, {
      role: args.role ?? undefined,
    });
    return null;
  },
});

/** Whether the welcome setup dialog should appear for the current user. */
export const getOnboardingStatus = authQuery({
  args: {},
  returns: v.object({ show: v.boolean() }),
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user) return { show: false };
    if (user.onboardingCompletedAt) return { show: false };

    return { show: true };
  },
});

/** Marks the welcome setup flow as completed (continue or skip). */
export const completeOnboarding = authMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.db.patch(ctx.userId, { onboardingCompletedAt: Date.now() });
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
