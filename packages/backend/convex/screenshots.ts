import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachMedia = action({
  args: {
    parentId: v.union(
      v.id("sessions"),
      v.id("designSessions"),
      v.id("researchQueries"),
    ),
    imageStorageId: v.optional(v.id("_storage")),
    videoStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.messages.updateLastInternal, {
      parentId: args.parentId,
      imageStorageId: args.imageStorageId,
      videoStorageId: args.videoStorageId,
    });
    return null;
  },
});
