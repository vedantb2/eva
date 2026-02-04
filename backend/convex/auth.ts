import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { themeValidator } from "./validators";

export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx
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

export const createOrMigrateUser = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
  },
  returns: v.object({
    userId: v.id("users"),
    wasCreated: v.boolean(),
    wasMigrated: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const clerkUserId = identity.subject;
    const email = identity.email || "";

    if (!email) {
      throw new Error("Email is required");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      console.log(`User already exists for email: ${email}`);
      return {
        userId: existingUser._id,
        wasCreated: false,
        wasMigrated: false,
      };
    }

    const userId = await ctx.db.insert("users", {
      clerkId: clerkUserId,
      email,
      firstName: args.firstName || undefined,
      lastName: args.lastName || undefined,
      fullName: args.fullName || undefined,
      // createdAt: now,
      // updatedAt: now,
    });

    console.log(`Created new user: ${userId} for email: ${email}`);
    const wasMigrated = await runMigration(ctx, clerkUserId, userId, email);
    return {
      userId,
      wasCreated: true,
      wasMigrated,
    };
  },
});

async function runMigration(
  ctx: MutationCtx,
  clerkUserId: string,
  userId: Id<"users">,
  email: string
): Promise<undefined> {
  const now = Date.now();

  const migrationId = await ctx.db.insert("userMigrations", {
    clerkUserId,
    userId,
    email,
    migratedAt: now,
    migrationStatus: "started",
  });
}

export const me = query({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    return await getCurrentUserId(ctx);
  },
});

export const isCurrentUserAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return false;
    }

    const user = await ctx.db.get(userId);
    return user?.isAdmin === true;
  },
});

export const ensureUserExists = mutation({
  args: {},
  returns: v.object({
    userId: v.id("users"),
    wasCreated: v.boolean(),
  }),
  handler: async (ctx, args) => {
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

export const getTheme = query({
  args: {},
  returns: v.union(themeValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return user?.theme ?? null;
  },
});

export const setTheme = mutation({
  args: { theme: themeValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { theme: args.theme });
    return null;
  },
});

export const getToolbarVisible = query({
  args: {},
  returns: v.union(v.boolean(), v.null()),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return user?.toolbarVisible ?? null;
  },
});

export const setToolbarVisible = mutation({
  args: { visible: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { toolbarVisible: args.visible });
    return null;
  },
});
