import { v } from "convex/values";
import { internal } from "./_generated/api";
import { authMutation, authAction } from "./functions";
import { chatTurnIdentityFields } from "./_validators/tableFields";

/** Generates a temporary upload URL for storing screenshot/video files. */
export const generateUploadUrl = authMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Attaches uploaded media storage IDs (ordered) to the most recent message of a parent entity. */
export const attachMedia = authAction({
  args: {
    parentId: v.union(v.id("sessions"), v.id("projects"), v.id("agentTasks")),
    imageStorageId: v.optional(v.id("_storage")),
    videoStorageId: v.optional(v.id("_storage")),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    ...chatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.messages.updateExactInternal, {
      parentId: args.parentId,
      turnId: args.turnId,
      assistantMessageId: args.assistantMessageId,
      attempt: args.attempt,
      mediaStorageIds: args.mediaStorageIds,
    });
    return null;
  },
});
