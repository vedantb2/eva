import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { appTabFields } from "./validators";

const appTabValidator = v.object({
  _id: v.id("appTabs"),
  _creationTime: v.number(),
  ...appTabFields,
});

/** Lists all custom tabs for an app (a repo row), enabled and disabled, ordered. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(appTabValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const tabs = await ctx.db
      .query("appTabs")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return tabs.sort((a, b) => a.order - b.order);
  },
});

/** Creates a custom tab for an app, appended after the existing tabs. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    name: v.string(),
    icon: v.string(),
    port: v.number(),
    enabled: v.boolean(),
  },
  returns: v.id("appTabs"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const existing = await ctx.db
      .query("appTabs")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const order =
      existing.reduce((max, tab) => Math.max(max, tab.order), -1) + 1;
    return await ctx.db.insert("appTabs", {
      repoId: args.repoId,
      name: args.name,
      icon: args.icon,
      port: args.port,
      enabled: args.enabled,
      order,
    });
  },
});

/** Updates a custom tab's name, icon, and port. */
export const update = authMutation({
  args: {
    id: v.id("appTabs"),
    name: v.string(),
    icon: v.string(),
    port: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tab = await ctx.db.get(args.id);
    if (!tab) throw new Error("Tab not found");
    if (!(await hasRepoAccess(ctx.db, tab.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.db.patch(args.id, {
      name: args.name,
      icon: args.icon,
      port: args.port,
    });
    return null;
  },
});

/** Toggles whether a custom tab is shown in sessions. */
export const toggleEnabled = authMutation({
  args: { id: v.id("appTabs"), enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tab = await ctx.db.get(args.id);
    if (!tab) throw new Error("Tab not found");
    if (!(await hasRepoAccess(ctx.db, tab.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.db.patch(args.id, { enabled: args.enabled });
    return null;
  },
});

/** Deletes a custom tab. */
export const remove = authMutation({
  args: { id: v.id("appTabs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tab = await ctx.db.get(args.id);
    if (!tab) throw new Error("Tab not found");
    if (!(await hasRepoAccess(ctx.db, tab.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.db.delete(args.id);
    return null;
  },
});
