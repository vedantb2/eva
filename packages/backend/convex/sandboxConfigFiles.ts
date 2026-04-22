import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { authMutation, authQuery, hasRepoAccess } from "./functions";

/** Regex for safe filenames: alphanumeric, dash, underscore, dot only. */
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/;

/** Generates an upload URL for a sandbox config file. */
export const generateUploadUrl = authMutation({
  args: { repoId: v.id("githubRepos") },
  returns: v.string(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/** Saves a sandbox config file record, replacing any existing file with the same name. */
export const save = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
  },
  returns: v.id("sandboxConfigFiles"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    // Validate filename for shell safety
    if (!SAFE_FILENAME_REGEX.test(args.fileName)) {
      throw new Error(
        "Invalid filename. Only alphanumeric characters, dashes, underscores, and dots are allowed.",
      );
    }

    // Check for existing file with same name and replace it
    const existing = await ctx.db
      .query("sandboxConfigFiles")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .filter((q) => q.eq(q.field("fileName"), args.fileName))
      .first();

    if (existing) {
      // Delete the old storage file
      await ctx.storage.delete(existing.storageId);
      // Update the record
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        fileSize: args.fileSize,
        uploadedBy: ctx.userId,
        createdAt: Date.now(),
      });
      return existing._id;
    }

    // Insert new record
    return await ctx.db.insert("sandboxConfigFiles", {
      repoId: args.repoId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      uploadedBy: ctx.userId,
      createdAt: Date.now(),
    });
  },
});

/** Lists all sandbox config files for a repo. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      _id: v.id("sandboxConfigFiles"),
      _creationTime: v.number(),
      repoId: v.id("githubRepos"),
      storageId: v.id("_storage"),
      fileName: v.string(),
      fileSize: v.number(),
      uploadedBy: v.id("users"),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    return await ctx.db
      .query("sandboxConfigFiles")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

/** Removes a sandbox config file and its storage. */
export const remove = authMutation({
  args: { id: v.id("sandboxConfigFiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) return null;

    if (!(await hasRepoAccess(ctx.db, file.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(args.id);
    return null;
  },
});

/** Internal query to get config file URLs for snapshot build. */
export const getConfigFilesForSnapshot = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      fileName: v.string(),
      url: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("sandboxConfigFiles")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    const results: Array<{ fileName: string; url: string | null }> = [];
    for (const file of files) {
      const url = await ctx.storage.getUrl(file.storageId);
      results.push({ fileName: file.fileName, url });
    }
    return results;
  },
});
