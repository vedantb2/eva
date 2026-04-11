import { v } from "convex/values";
import { internal } from "./_generated/api";
import { authMutation, authAction } from "./functions";

/** Generates a temporary upload URL for storing screenshot/video files. */
export const generateUploadUrl = authMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Attaches uploaded image/video storage IDs to the most recent message of a parent entity. */
export const attachMedia = authAction({
  args: {
    parentId: v.union(v.id("sessions"), v.id("designSessions")),
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
