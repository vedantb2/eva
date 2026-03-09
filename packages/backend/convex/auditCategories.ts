import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { internalQuery } from "./_generated/server";

const SYSTEM_DEFAULTS = [
  {
    name: "Accessibility",
    description:
      'WCAG checks (alt text, keyboard navigation, ARIA attributes, form labels, color contrast). If no frontend/UI code was changed, return a single item: { "requirement": "No UI changes", "passed": true, "detail": "No frontend code was modified" }.',
  },
  {
    name: "Testing",
    description:
      'Whether tests were added or needed. If changes are trivial config/docs, return: { "requirement": "Changes trivial", "passed": true, "detail": "No tests needed for this change" }.',
  },
  {
    name: "Code Review",
    description:
      "Implementation quality — correctness, bugs, security, error handling, naming, code style.",
  },
];

export const listByRepo = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      _id: v.id("auditCategories"),
      _creationTime: v.number(),
      repoId: v.id("githubRepos"),
      name: v.string(),
      description: v.string(),
      enabled: v.boolean(),
      isSystem: v.boolean(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const listEnabledByRepo = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      name: v.string(),
      description: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return categories
      .filter((c) => c.enabled)
      .map((c) => ({ name: c.name, description: c.description }));
  },
});

export const seedDefaults = authMutation({
  args: { repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    const existingNames = new Set(existing.map((c) => c.name));

    for (const def of SYSTEM_DEFAULTS) {
      if (!existingNames.has(def.name)) {
        await ctx.db.insert("auditCategories", {
          repoId: args.repoId,
          name: def.name,
          description: def.description,
          enabled: true,
          isSystem: true,
          createdAt: Date.now(),
        });
      }
    }

    return null;
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    name: v.string(),
    description: v.string(),
  },
  returns: v.id("auditCategories"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditCategories", {
      repoId: args.repoId,
      name: args.name,
      description: args.description,
      enabled: true,
      isSystem: false,
      createdAt: Date.now(),
    });
  },
});

export const update = authMutation({
  args: {
    id: v.id("auditCategories"),
    name: v.string(),
    description: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");
    if (category.isSystem) throw new Error("Cannot edit system categories");

    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
    });
    return null;
  },
});

export const toggleEnabled = authMutation({
  args: {
    id: v.id("auditCategories"),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");

    await ctx.db.patch(args.id, { enabled: args.enabled });
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("auditCategories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");
    if (category.isSystem) throw new Error("Cannot delete system categories");

    await ctx.db.delete(args.id);
    return null;
  },
});
