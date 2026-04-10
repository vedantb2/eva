import { query } from "./_generated/server";
import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { Timeline } from "convex-timeline";
import { components } from "./_generated/api";
import { evaluationStatusValidator, roleValidator } from "./validators";

const docTimeline = new Timeline(components.timeline, { maxNodesPerScope: 50 });

const snapshotValidator = v.object({ title: v.string(), content: v.string() });

/** Safely parses raw timeline data into a title/content snapshot, returning null if invalid. */
function parseSnapshot(
  data: unknown,
): { title: string; content: string } | null {
  if (typeof data !== "object" || data === null) return null;
  if (!("title" in data) || !("content" in data)) return null;
  if (typeof data.title !== "string" || typeof data.content !== "string")
    return null;
  return { title: data.title, content: data.content };
}

const interviewMessageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
});

const docValidator = v.object({
  _id: v.id("docs"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  title: v.string(),
  content: v.string(),
  description: v.optional(v.string()),
  userFlows: v.optional(
    v.array(v.object({ name: v.string(), steps: v.array(v.string()) })),
  ),
  requirements: v.optional(v.array(v.string())),
  interviewHistory: v.optional(v.array(interviewMessageValidator)),
  sandboxId: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  testGenStatus: v.optional(evaluationStatusValidator),
  testPrUrl: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

/** Lists all docs for a given repo, filtered by user access. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(docValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    return await ctx.db
      .query("docs")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

/** Fetches a single doc by ID, with access control. */
export const get = authQuery({
  args: { id: v.id("docs") },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    if (!(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId))) return null;
    return doc;
  },
});

/** Creates a new doc in a repo with optional description, user flows, and requirements. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    content: v.string(),
    description: v.optional(v.string()),
    userFlows: v.optional(
      v.array(v.object({ name: v.string(), steps: v.array(v.string()) })),
    ),
    requirements: v.optional(v.array(v.string())),
  },
  returns: v.id("docs"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const now = Date.now();
    return await ctx.db.insert("docs", {
      repoId: args.repoId,
      title: args.title,
      content: args.content,
      description: args.description,
      userFlows: args.userFlows,
      requirements: args.requirements,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Updates a doc's title, content, description, user flows, or requirements. */
export const update = authMutation({
  args: {
    id: v.id("docs"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    description: v.optional(v.string()),
    userFlows: v.optional(
      v.array(v.object({ name: v.string(), steps: v.array(v.string()) })),
    ),
    requirements: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    const updates: {
      title?: string;
      content?: string;
      description?: string;
      userFlows?: Array<{ name: string; steps: string[] }>;
      requirements?: string[];
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.description !== undefined) updates.description = args.description;
    if (args.userFlows !== undefined) updates.userFlows = args.userFlows;
    if (args.requirements !== undefined)
      updates.requirements = args.requirements;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/** Deletes a doc and its associated timeline history. */
export const remove = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    await docTimeline.deleteScope(ctx, `doc:${args.id}`);
    await ctx.db.delete(args.id);
    return null;
  },
});

/** Marks a doc as having test generation in progress. */
export const startTestGen = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    await ctx.db.patch(args.id, {
      testGenStatus: "running",
      testPrUrl: undefined,
    });
    return null;
  },
});

/** Marks test generation as completed and saves the PR URL. */
export const completeTestGen = authMutation({
  args: { id: v.id("docs"), prUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    await ctx.db.patch(args.id, {
      testGenStatus: "completed",
      testPrUrl: args.prUrl,
    });
    return null;
  },
});

/** Marks test generation as failed with an error status. */
export const failTestGen = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    await ctx.db.patch(args.id, {
      testGenStatus: "error",
    });
    return null;
  },
});

/** Saves a new version snapshot to the doc's timeline for undo/redo support. */
export const saveVersion = authMutation({
  args: { id: v.id("docs"), content: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    await docTimeline.push(ctx, `doc:${args.id}`, {
      title: doc.title,
      content: args.content,
    });
    return null;
  },
});

/** Undoes the last change by restoring the previous timeline snapshot. */
export const timelineUndo = authMutation({
  args: { id: v.id("docs") },
  returns: v.union(snapshotValidator, v.null()),
  handler: async (ctx, args) => {
    const result = await docTimeline.undo(ctx, `doc:${args.id}`);
    const snapshot = parseSnapshot(result);
    if (snapshot) {
      await ctx.db.patch(args.id, {
        title: snapshot.title,
        updatedAt: Date.now(),
      });
    }
    return snapshot;
  },
});

/** Redoes a previously undone change by advancing to the next timeline snapshot. */
export const timelineRedo = authMutation({
  args: { id: v.id("docs") },
  returns: v.union(snapshotValidator, v.null()),
  handler: async (ctx, args) => {
    const result = await docTimeline.redo(ctx, `doc:${args.id}`);
    const snapshot = parseSnapshot(result);
    if (snapshot) {
      await ctx.db.patch(args.id, {
        title: snapshot.title,
        updatedAt: Date.now(),
      });
    }
    return snapshot;
  },
});

/** Returns the current undo/redo status (can undo, can redo, position, length). */
export const timelineStatus = authQuery({
  args: { id: v.id("docs") },
  returns: v.object({
    canUndo: v.boolean(),
    canRedo: v.boolean(),
    position: v.union(v.number(), v.null()),
    length: v.number(),
  }),
  handler: async (ctx, args) => {
    return await docTimeline.status(ctx, `doc:${args.id}`);
  },
});

/** Lists all timeline snapshots with their position and title for version history display. */
export const timelineHistory = authQuery({
  args: { id: v.id("docs") },
  returns: v.array(v.object({ position: v.number(), title: v.string() })),
  handler: async (ctx, args) => {
    const nodes = await docTimeline.listNodes(ctx, `doc:${args.id}`);
    return nodes.map((node) => {
      const snapshot = parseSnapshot(node.document);
      return { position: node.position, title: snapshot?.title ?? "Untitled" };
    });
  },
});

/** Appends a message to the doc's interview conversation history. */
export const addInterviewMessage = authMutation({
  args: {
    id: v.id("docs"),
    role: roleValidator,
    content: v.string(),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    const history = doc.interviewHistory ?? [];
    history.push({
      role: args.role,
      content: args.content,
      activityLog: args.activityLog,
      userId: ctx.userId,
    });
    await ctx.db.patch(args.id, { interviewHistory: history });
    return null;
  },
});

/** Updates the content or activity log of the last interview message (for streaming). */
export const updateLastInterviewMessage = authMutation({
  args: {
    id: v.id("docs"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    const history = [...(doc.interviewHistory ?? [])];
    const last = history[history.length - 1];
    if (!last) return null;
    if (args.content !== undefined) last.content = args.content;
    if (args.activityLog !== undefined) last.activityLog = args.activityLog;
    await ctx.db.patch(args.id, { interviewHistory: history });
    return null;
  },
});

/** Clears a doc's interview history and associated sandbox. */
export const clearInterview = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    await ctx.db.patch(args.id, {
      interviewHistory: undefined,
      sandboxId: undefined,
    });
    return null;
  },
});

/** Associates a sandbox ID with a doc for live interview execution. */
export const updateDocSandbox = authMutation({
  args: { id: v.id("docs"), sandboxId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    await ctx.db.patch(args.id, { sandboxId: args.sandboxId });
    return null;
  },
});
