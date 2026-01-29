import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";
import { Timeline } from "convex-timeline";
import { components } from "./_generated/api";

const docTimeline = new Timeline(components.timeline, { maxNodesPerScope: 50 });

const snapshotValidator = v.object({ title: v.string(), content: v.string() });

function parseSnapshot(data: unknown): { title: string; content: string } | null {
  if (typeof data !== "object" || data === null) return null;
  if (!("title" in data) || !("content" in data)) return null;
  if (typeof data.title !== "string" || typeof data.content !== "string") return null;
  return { title: data.title, content: data.content };
}

const docValidator = v.object({
  _id: v.id("docs"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  title: v.string(),
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(docValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("docs")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("docs") },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    content: v.string(),
  },
  returns: v.id("docs"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const now = Date.now();
    return await ctx.db.insert("docs", {
      repoId: args.repoId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("docs"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    const updates: { title?: string; content?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    await docTimeline.deleteScope(ctx, `doc:${args.id}`);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const saveVersion = mutation({
  args: { id: v.id("docs"), content: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    await docTimeline.push(ctx, `doc:${args.id}`, {
      title: doc.title,
      content: args.content,
    });
    return null;
  },
});

export const timelineUndo = mutation({
  args: { id: v.id("docs") },
  returns: v.union(snapshotValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const result = await docTimeline.undo(ctx, `doc:${args.id}`);
    const snapshot = parseSnapshot(result);
    if (snapshot) {
      await ctx.db.patch(args.id, { title: snapshot.title, updatedAt: Date.now() });
    }
    return snapshot;
  },
});

export const timelineRedo = mutation({
  args: { id: v.id("docs") },
  returns: v.union(snapshotValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const result = await docTimeline.redo(ctx, `doc:${args.id}`);
    const snapshot = parseSnapshot(result);
    if (snapshot) {
      await ctx.db.patch(args.id, { title: snapshot.title, updatedAt: Date.now() });
    }
    return snapshot;
  },
});

export const timelineStatus = query({
  args: { id: v.id("docs") },
  returns: v.object({
    canUndo: v.boolean(),
    canRedo: v.boolean(),
    position: v.union(v.number(), v.null()),
    length: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return { canUndo: false, canRedo: false, position: null, length: 0 };
    return await docTimeline.status(ctx, `doc:${args.id}`);
  },
});

export const timelineHistory = query({
  args: { id: v.id("docs") },
  returns: v.array(v.object({ position: v.number(), title: v.string() })),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const nodes = await docTimeline.listNodes(ctx, `doc:${args.id}`);
    return nodes.map((node) => {
      const snapshot = parseSnapshot(node.document);
      return { position: node.position, title: snapshot?.title ?? "Untitled" };
    });
  },
});

