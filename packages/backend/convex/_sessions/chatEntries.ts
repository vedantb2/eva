import { v } from "convex/values";
import { authQuery, hasRepoAccess } from "../functions";
import { taskSandboxStatusValidator } from "../_validators/enums";

/**
 * A virtual sidebar entry for a project or quick-task sandbox chat. These are
 * derived on read from `projects` / `agentTasks` + their latest `messages`
 * row rather than stored — there is no dedicated table, so "listing" them
 * means recomputing this shape every query.
 */
export const chatEntryValidator = v.union(
  v.object({
    kind: v.literal("project"),
    id: v.id("projects"),
    title: v.string(),
    userId: v.id("users"),
    lastMessageAt: v.number(),
    status: taskSandboxStatusValidator,
  }),
  v.object({
    kind: v.literal("task"),
    id: v.id("agentTasks"),
    title: v.string(),
    userId: v.id("users"),
    lastMessageAt: v.number(),
    status: taskSandboxStatusValidator,
  }),
);

/**
 * Lists virtual sandbox-chat entries (project chats + quick-task chats) for a
 * repo, sorted by most recent chat activity. Only entities with at least one
 * message are included, since a chat with no messages has nothing to show in
 * the sidebar. Intentionally kept out of `sessions.list` — that query's cache
 * is optimistically updated with session-shaped docs, and merging shapes
 * there would break those updates.
 */
export const listChatEntries = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(chatEntryValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];

    // Bounded scans: `.take(...)` caps below keep this query cheap even for
    // repos with a long project/task history, at the cost of not surfacing
    // chats older than the cap (acceptable — the sidebar only needs recent
    // activity).
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .take(100);

    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo_and_updatedAt", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .take(300);
    const quickTasks = tasks.filter((task) => task.projectId === undefined);

    const projectEntries = await Promise.all(
      projects.map(async (project) => {
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_parent", (q) => q.eq("parentId", project._id))
          .order("desc")
          .first();
        if (!lastMessage) return null;
        return {
          kind: "project" as const,
          id: project._id,
          title: project.title,
          userId: project.userId,
          lastMessageAt: lastMessage.timestamp,
          status: project.reviewProjectSandboxStatus ?? "closed",
        };
      }),
    );

    const taskEntries = await Promise.all(
      quickTasks.map(async (task) => {
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_parent", (q) => q.eq("parentId", task._id))
          .order("desc")
          .first();
        if (!lastMessage) return null;
        return {
          kind: "task" as const,
          id: task._id,
          title: task.title,
          userId: task.createdBy,
          lastMessageAt: lastMessage.timestamp,
          status: task.reviewTaskSandboxStatus ?? "closed",
        };
      }),
    );

    return [...projectEntries, ...taskEntries]
      .filter((entry) => entry !== null)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});
