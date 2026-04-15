import { internal } from "../_generated/api";
import { v } from "convex/values";
import { roleValidator, phaseValidator } from "../validators";
import {
  authMutation,
  hasRepoAccess,
  getProjectWithAccess,
  deleteTaskRelatedData,
} from "../functions";
import {
  getProjectConversation,
  setProjectConversation,
  setProjectGeneratedSpec,
  deleteProjectDetails,
} from "./helpers";

/** Creates a new project in draft phase with an initial conversation message. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    rawInput: v.string(),
    baseBranch: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const projectId = await ctx.db.insert("projects", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      rawInput: args.rawInput,
      baseBranch: args.baseBranch,
      phase: "draft",
      projectStartDate: Date.now(),
    });
    await setProjectConversation(ctx.db, projectId, [
      {
        role: "user",
        content: args.rawInput,
        userId: ctx.userId,
      },
    ]);
    return projectId;
  },
});

/** Updates editable fields on a project, including its generated spec. */
export const update = authMutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    branchName: v.optional(v.string()),
    generatedSpec: v.optional(v.string()),
    phase: v.optional(phaseValidator),
    projectLead: v.optional(v.union(v.id("users"), v.null())),
    members: v.optional(v.array(v.id("users"))),
    projectStartDate: v.optional(v.number()),
    projectEndDate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const { id, generatedSpec, projectLead, ...fields } = args;
    const updates: Record<string, string | number | Array<string> | undefined> =
      {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    if (projectLead !== undefined)
      updates.projectLead = projectLead ?? undefined;
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);
    }
    if (generatedSpec !== undefined) {
      await setProjectGeneratedSpec(ctx.db, args.id, generatedSpec);
    }
    return null;
  },
});

/** Appends a message to the project conversation history. */
export const addMessage = authMutation({
  args: {
    id: v.id("projects"),
    role: roleValidator,
    content: v.string(),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const conversation = await getProjectConversation(ctx.db, args.id);
    await setProjectConversation(ctx.db, args.id, [
      ...conversation,
      {
        role: args.role,
        content: args.content,
        activityLog: args.activityLog,
        userId: ctx.userId,
      },
    ]);
    return null;
  },
});

/** Deletes a project and its associated details document. */
export const remove = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await deleteProjectDetails(ctx.db, args.id);
    await ctx.db.delete(args.id);
    return null;
  },
});

/** Deletes a project along with all its tasks and their related data. */
export const deleteCascade = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const task of tasks) {
      await deleteTaskRelatedData(ctx, task._id);
    }
    await deleteProjectDetails(ctx.db, args.id);
    await ctx.db.delete(args.id);
    return null;
  },
});

/** Clears all conversation messages from a project. */
export const clearMessages = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await setProjectConversation(ctx.db, args.id, []);
    return null;
  },
});

/** Sets the pull request URL on a project. */
export const updatePrUrl = authMutation({
  args: {
    id: v.id("projects"),
    prUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, { prUrl: args.prUrl });
    return null;
  },
});

/** Associates a sandbox ID with a project and records the activity timestamp. */
export const updateProjectSandbox = authMutation({
  args: {
    id: v.id("projects"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, {
      sandboxId: args.sandboxId,
      lastSandboxActivity: Date.now(),
    });
    return null;
  },
});

/** Removes the sandbox association from a project and triggers sandbox deletion. */
export const clearProjectSandbox = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    if (project.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.deleteSandbox, {
        sandboxId: project.sandboxId,
        repoId: project.repoId,
      });
    }
    await ctx.db.patch(args.id, {
      sandboxId: undefined,
      lastSandboxActivity: undefined,
    });
    return null;
  },
});

/** Updates the last sandbox activity timestamp on a project. */
export const updateLastSandboxActivity = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, { lastSandboxActivity: Date.now() });
    return null;
  },
});

/** Updates the content or activity log of the last conversation message in a project. */
export const updateLastConversationMessage = authMutation({
  args: {
    id: v.id("projects"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const messages = [...(await getProjectConversation(ctx.db, args.id))];
    const last = messages[messages.length - 1];
    if (!last) return null;
    if (args.content !== undefined) last.content = args.content;
    if (args.activityLog !== undefined) last.activityLog = args.activityLog;
    await setProjectConversation(ctx.db, args.id, messages);
    return null;
  },
});
