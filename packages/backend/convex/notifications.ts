import { MutationCtx } from "./_generated/server";
import { v, Infer } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { notificationTypeValidator } from "./validators";
import { authQuery, authMutation } from "./functions";

function getRepoHref(
  owner: string,
  name: string,
  rootDirectory?: string,
): string {
  if (!rootDirectory) return `/${owner}/${name}`;
  const appName = rootDirectory.split("/").pop();
  return `/${owner}/${name}/${appName}`;
}

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
    taskId?: Id<"agentTasks">;
  },
) {
  let href = params.href;
  if (!href && params.repoId) {
    const repo = await ctx.db.get(params.repoId);
    if (repo) {
      const baseHref = getRepoHref(repo.owner, repo.name, repo.rootDirectory);
      if (params.taskId && !params.projectId) {
        href = `${baseHref}/quick-tasks/${params.taskId}`;
      } else if (params.projectId) {
        href = `${baseHref}/projects/${params.projectId}`;
      } else {
        href = `${baseHref}/quick-tasks`;
      }
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

export const list = authQuery({
  args: {},
  returns: v.array(notificationValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .order("desc")
      .take(100);
  },
});

export const get = authQuery({
  args: { id: v.id("notifications") },
  returns: v.union(notificationValidator, v.null()),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== ctx.userId) return null;
    return notification;
  },
});

export const countUnread = authQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", ctx.userId).eq("read", false),
      )
      .take(100);
    return unread.length;
  },
});

export const markAsRead = authMutation({
  args: { id: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== ctx.userId)
      throw new Error("Not found");
    if (!notification.read) {
      await ctx.db.patch(args.id, { read: true });
    }
    return null;
  },
});

export const markAllAsRead = authMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", ctx.userId).eq("read", false),
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
    return null;
  },
});
