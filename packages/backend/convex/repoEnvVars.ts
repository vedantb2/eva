import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { authQuery, authMutation } from "./functions";

/** Lists repo env vars for the authenticated user, masking actual values. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      key: v.string(),
      value: v.string(),
      sandboxExclude: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return [];
    return doc.vars.map((entry) => ({
      key: entry.key,
      value: "••••••",
      sandboxExclude: entry.sandboxExclude ?? false,
    }));
  },
});

/** Returns all repo env vars with raw encrypted values (internal use only). */
export const getAllInternal = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      key: v.string(),
      value: v.string(),
      sandboxExclude: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return [];
    return doc.vars;
  },
});

/** Returns repo env vars eligible for sandbox injection (excludes sandbox-excluded vars). */
export const getForSandbox = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return [];
    return doc.vars
      .filter((entry) => !entry.sandboxExclude)
      .map((entry) => ({ key: entry.key, value: entry.value }));
  },
});

/** Inserts or updates a single env var for a repo (internal use only). */
export const upsertVarInternal = internalMutation({
  args: {
    repoId: v.id("githubRepos"),
    key: v.string(),
    value: v.string(),
    sandboxExclude: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (doc) {
      const vars = doc.vars.filter((entry) => entry.key !== args.key);
      vars.push({
        key: args.key,
        value: args.value,
        sandboxExclude: args.sandboxExclude ?? false,
      });
      await ctx.db.patch(doc._id, { vars, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("repoEnvVars", {
        repoId: args.repoId,
        vars: [
          {
            key: args.key,
            value: args.value,
            sandboxExclude: args.sandboxExclude ?? false,
          },
        ],
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/** Removes an env var by key from a repo's env var document. */
export const removeVar = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return null;
    const vars = doc.vars.filter((entry) => entry.key !== args.key);
    await ctx.db.patch(doc._id, { vars, updatedAt: Date.now() });
    return null;
  },
});

/** Toggles the sandboxExclude flag for a specific repo env var. */
export const toggleSandboxExclude = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    key: v.string(),
    sandboxExclude: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return null;
    const vars = doc.vars.map((entry) =>
      entry.key === args.key
        ? { ...entry, sandboxExclude: args.sandboxExclude }
        : entry,
    );
    await ctx.db.patch(doc._id, { vars, updatedAt: Date.now() });
    return null;
  },
});
