import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const upload = action({
  args: {
    sessionId: v.id("sessions"),
    imageBase64: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const raw = atob(args.imageBase64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "image/png" });

    const storageId = await ctx.storage.store(blob);

    await ctx.runMutation(internal.messages.addInternal, {
      parentId: args.sessionId,
      role: "assistant",
      content: "Agent took a screenshot",
      imageStorageId: storageId,
    });

    return null;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveVideoMessage = mutation({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "Agent recorded a video",
      timestamp: Date.now(),
      videoStorageId: args.storageId,
    });
    return null;
  },
});
