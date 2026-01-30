import { mutation, query, MutationCtx } from "./_generated/server";
import { v, Infer } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getCurrentUserId } from "./auth";
import { notificationTypeValidator } from "./validators";

export async function createNotification(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    title: string;
    type?: Infer<typeof notificationTypeValidator>;
    message?: string;
    href?: string;
    repoId?: Id<"githubRepos">;
    projectId?: Id<"projects">;
  }
) {
  let href = params.href;
  if (!href && params.repoId) {
    const repo = await ctx.db.get(params.repoId);
    if (repo) {
      const slug = `${repo.owner}-${repo.name}`;
      href = params.projectId
        ? `/${slug}/projects/${params.projectId}`
        : `/${slug}/quick-tasks`;
    }
  }
  await ctx.db.insert("notifications", {
    userId: params.userId,
    type: params.type ?? "system",
    title: params.title,
    message: params.message,
    href,
    repoId: params.repoId,
    read: false,
    createdAt: Date.now(),
  });
}

const notificationValidator = v.object({
  _id: v.id("notifications"),
  _creationTime: v.number(),
  userId: v.id("users"),
  type: notificationTypeValidator,
  title: v.string(),
  message: v.optional(v.string()),
  read: v.boolean(),
  href: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
  createdAt: v.number(),
});

export const list = query({
  args: {},
  returns: v.array(notificationValidator),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("notifications") },
  returns: v.union(notificationValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== userId) return null;
    return notification;
  },
});

export const countUnread = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== userId)
      throw new Error("Not found");
    await ctx.db.patch(args.id, { read: true });
    return null;
  },
});

export const markAllAsRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", userId).eq("read", false)
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
    return null;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.optional(v.string()),
    href: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      href: args.href,
      repoId: args.repoId,
      read: false,
      createdAt: Date.now(),
    });
  },
});
