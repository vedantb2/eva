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
  // Resolved agent proof media (recordings/screenshots), in capture order.
  media: v.optional(
    v.array(
      v.object({
        url: v.union(v.string(), v.null()),
        contentType: v.union(v.string(), v.null()),
      }),
    ),
  ),
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
      // mediaStorageIds is the source of truth for new docs. Pre-migration
      // docs only have the legacy single imageStorageId/videoStorageId
      // fields, so fall back to resolving those (video first, as before).
      const mediaIds =
        m.mediaStorageIds ??
        [m.videoStorageId, m.imageStorageId].filter(
          (id): id is Id<"_storage"> => id !== undefined,
        );
      const media =
        mediaIds.length > 0
          ? await Promise.all(
              mediaIds.map(async (id) => {
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
        media,
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
    // Legacy single-media args: stale callback bundles still in flight during
    // a deploy call with these instead of mediaStorageIds. New callers use
    // mediaStorageIds.
    imageStorageId: v.optional(v.id("_storage")),
    videoStorageId: v.optional(v.id("_storage")),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
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
      mediaStorageIds?: Id<"_storage">[];
    } = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    if (args.variations !== undefined) patch.variations = args.variations;

    // Append this call's ids (video then image, for legacy callers) so
    // repeated calls within a turn accumulate instead of overwriting.
    const newIds = [
      ...(args.mediaStorageIds ?? []),
      ...(args.videoStorageId ? [args.videoStorageId] : []),
      ...(args.imageStorageId ? [args.imageStorageId] : []),
    ];
    if (newIds.length > 0) {
      patch.mediaStorageIds = [...(last.mediaStorageIds ?? []), ...newIds];
    }

    await ctx.db.patch(last._id, patch);
    return null;
  },
});
