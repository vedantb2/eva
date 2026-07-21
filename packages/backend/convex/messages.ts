import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authQuery, authMutation } from "./functions";
import { variationValidator, messageFields } from "./validators";

const parentIdValidator = messageFields.parentId;

const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  ...messageFields,
  imageUrl: v.optional(v.union(v.string(), v.null())),
  videoUrl: v.optional(v.union(v.string(), v.null())),
  // Resolved URLs for user-attached input files, in the same order as
  // attachmentStorageIds. Entries that fail to resolve are null.
  attachmentUrls: v.optional(v.array(v.union(v.string(), v.null()))),
  // Parallel metadata for rendering (image thumb vs file chip).
  attachments: v.optional(
    v.array(
      v.object({
        url: v.union(v.string(), v.null()),
        contentType: v.union(v.string(), v.null()),
      }),
    ),
  ),
});

/** Temporary upload URL for a composer image attachment (client POSTs the file, then sends the message). */
export const generateUploadUrl = authMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

/** Fetches messages for a parent and resolves their image/video/attachment storage URLs. */
async function resolveMessageUrls(
  ctx: Pick<QueryCtx, "db" | "storage">,
  parentId: typeof parentIdValidator.type,
) {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
  return Promise.all(
    messages.map(async (m) => {
      const attachmentEntries = m.attachmentStorageIds
        ? await Promise.all(
            m.attachmentStorageIds.map(async (id) => {
              const [url, meta] = await Promise.all([
                ctx.storage.getUrl(id),
                ctx.storage.getMetadata(id),
              ]);
              return {
                url,
                contentType: meta?.contentType ?? null,
              };
            }),
          )
        : undefined;
      return {
        ...m,
        imageUrl: m.imageStorageId
          ? await ctx.storage.getUrl(m.imageStorageId)
          : undefined,
        videoUrl: m.videoStorageId
          ? await ctx.storage.getUrl(m.videoStorageId)
          : undefined,
        attachmentUrls: attachmentEntries
          ? attachmentEntries.map((entry) => entry.url)
          : undefined,
        attachments: attachmentEntries,
      };
    }),
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
      variations?: (typeof variationValidator.type)[];
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
