import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authQuery } from "./functions";
import { variationValidator, messageFields } from "./validators";

const parentIdValidator = messageFields.parentId;

const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  ...messageFields,
  imageUrl: v.optional(v.union(v.string(), v.null())),
  videoUrl: v.optional(v.union(v.string(), v.null())),
});

/** Fetches messages for a parent and resolves their image/video storage URLs. */
async function resolveMessageUrls(
  ctx: Pick<QueryCtx, "db" | "storage">,
  parentId: typeof parentIdValidator.type,
) {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
  return Promise.all(
    messages.map(async (m) => ({
      ...m,
      imageUrl: m.imageStorageId
        ? await ctx.storage.getUrl(m.imageStorageId)
        : undefined,
      videoUrl: m.videoStorageId
        ? await ctx.storage.getUrl(m.videoStorageId)
        : undefined,
    })),
  );
}

/** Lists all messages for a parent entity (session, doc, etc.) with resolved media URLs. */
export const listByParent = authQuery({
  args: { parentId: parentIdValidator },
  returns: v.array(messageValidator),
  handler: async (ctx, args) => resolveMessageUrls(ctx, args.parentId),
});

/** Updates the most recent message for a parent (internal use, for streaming updates). */
export const updateLastInternal = internalMutation({
  args: {
    parentId: parentIdValidator,
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
    variations: v.optional(v.array(variationValidator)),
    imageStorageId: v.optional(v.id("_storage")),
    videoStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .order("desc")
      .first();
    if (!last) return null;

    const patch: {
      content?: string;
      activityLog?: string;
      variations?: Array<{
        label: string;
        route?: string;
        filePath?: string;
      }>;
      imageStorageId?: Id<"_storage">;
      videoStorageId?: Id<"_storage">;
    } = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    if (args.variations !== undefined) patch.variations = args.variations;
    if (args.imageStorageId !== undefined)
      patch.imageStorageId = args.imageStorageId;
    if (args.videoStorageId !== undefined)
      patch.videoStorageId = args.videoStorageId;

    await ctx.db.patch(last._id, patch);
    return null;
  },
});
