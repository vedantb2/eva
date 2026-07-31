import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { messageFields } from "./validators";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import {
  appendMediaStorageIds,
  messageMediaStorageIds,
} from "./_messages/media";

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

/** Resolves storage only for the documents in the current result page. */
async function resolveMessagesUrls(
  ctx: Pick<QueryCtx, "storage">,
  messages: Doc<"messages">[],
) {
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
      const mediaIds = messageMediaStorageIds(m);
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

/** Newest-first reactive pages; clients reverse loaded results for chronology. */
export const listByParentPaginated = authQuery({
  args: {
    parentId: parentIdValidator,
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(messageValidator),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: await resolveMessagesUrls(ctx, result.page),
    };
  },
});

/** Narrow sandbox-panel read: the newest assistant turn containing designs. */
export const getLatestSessionDesignMessage = authQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.union(messageValidator, v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (
      session === null ||
      !(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))
    ) {
      return null;
    }
    return await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .filter((q) =>
        q.and(
          q.eq(q.field("role"), "assistant"),
          q.neq(q.field("variations"), undefined),
        ),
      )
      .first();
  },
});

/** Applies callback output to one explicitly owned assistant row. */
export const updateExactInternal = internalMutation({
  args: {
    parentId: parentIdValidator,
    turnId: v.string(),
    assistantMessageId: v.id("messages"),
    attempt: v.number(),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    void args.attempt;
    const message = await ctx.db.get(args.assistantMessageId);
    if (
      message === null ||
      message.parentId !== args.parentId ||
      message.turnId !== args.turnId ||
      message.role !== "assistant"
    ) {
      return false;
    }
    const mediaStorageIds = appendMediaStorageIds(message.mediaStorageIds, {
      mediaStorageIds: args.mediaStorageIds,
    });
    await ctx.db.patch(args.assistantMessageId, {
      content: args.content,
      activityLog: args.activityLog,
      mediaStorageIds,
    });
    return true;
  },
});
