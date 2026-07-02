import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import { components } from "./_generated/api";
import { internal } from "./_generated/api";
import {
  evaluationStatusValidator,
  prRecapStatusValidator,
  roleValidator,
  docKindValidator,
} from "./validators";
import { docFields } from "./validators";
import { prosemirrorSync } from "./prosemirrorSync";
import { markdownToDocJson } from "./_docEditor/markdown";
import { workflow } from "./workflowManager";
import { trackDocWorkflow } from "./workflowWatchdog";
import {
  findAllSiblingRepoIds,
  findSiblingRepos,
  hasCodebaseRepoAccess,
  resolveCodebaseDocsRepoId,
} from "./_githubRepos/helpers";

const interviewMessageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
});

const docValidator = v.object({
  _id: v.id("docs"),
  _creationTime: v.number(),
  ...docFields,
});

/** Lists all docs for a given repo, filtered by user access. PR recaps are shared across monorepo apps. */
export const list = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    kind: v.optional(docKindValidator),
  },
  returns: v.array(docValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];

    const siblingIds = await findAllSiblingRepoIds(ctx.db, args.repoId);
    const seen = new Set<string>();
    const docs = [];

    for (const siblingId of siblingIds) {
      const siblingDocs = await ctx.db
        .query("docs")
        .withIndex("by_repo", (q) => q.eq("repoId", siblingId))
        .collect();

      for (const doc of siblingDocs) {
        if (seen.has(doc._id)) continue;
        if (args.kind !== undefined && doc.kind !== args.kind) continue;
        const isCurrentRepo = siblingId === args.repoId;
        const isSharedRecap = doc.kind === "pr-recap";
        if (!isCurrentRepo && !isSharedRecap) continue;
        seen.add(doc._id);
        docs.push(doc);
      }
    }

    return docs;
  },
});

/** Fetches a PR recap doc by pull request URL. */
export const getRecapByPrUrl = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    prUrl: v.string(),
  },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    if (!(await hasCodebaseRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return null;
    }
    const docsRepoId = await resolveCodebaseDocsRepoId(ctx.db, args.repoId);
    const doc = await ctx.db
      .query("docs")
      .withIndex("by_repo_and_pr_url", (q) =>
        q.eq("repoId", docsRepoId).eq("prUrl", args.prUrl),
      )
      .first();
    if (!doc || doc.kind !== "pr-recap") return null;
    return doc;
  },
});

/** Fetches a single doc by ID, with access control. PR recaps allow any sibling app repo access. */
export const get = authQuery({
  args: { id: v.id("docs") },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;

    if (doc.kind === "pr-recap") {
      if (!(await hasCodebaseRepoAccess(ctx.db, doc.repoId, ctx.userId))) {
        return null;
      }
      return doc;
    }

    if (!(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId))) return null;
    return doc;
  },
});

/** Creates a new doc in a repo. Requirements/userFlows are populated by extraction (docPrdWorkflow), not by this mutation. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    content: v.string(),
  },
  returns: v.id("docs"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const now = Date.now();
    const docId = await ctx.db.insert("docs", {
      repoId: args.repoId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    await prosemirrorSync.create(ctx, docId, markdownToDocJson(args.content));

    return docId;
  },
});

/** Updates a doc's title or description. Content is now managed via live sync. */
export const update = authMutation({
  args: {
    id: v.id("docs"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    description: v.optional(v.string()),
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
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.description !== undefined) updates.description = args.description;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/** Returns the doc associated with a session, if any. Used by PRD tab to determine Save vs Update label. */
export const getBySession = authQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) return null;
    return await ctx.db
      .query("docs")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

/** Saves a session's plan content as a doc. If a doc already exists for this session, updates its content. */
export const createFromSession = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.id("docs"),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const planContent = session.planContent?.trim();
    if (!planContent) {
      throw new Error("Session has no plan content to save");
    }
    const existing = await ctx.db
      .query("docs")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    const now = Date.now();
    const planJson = markdownToDocJson(session.planContent ?? "");

    if (existing) {
      // "Update Document": overwrite the live synced doc with the latest plan.
      // We reset the sync component's data and recreate it (rather than a
      // server-side transform, which would need the full editor schema in the
      // isolate). This is an explicit, infrequent overwrite, so clobbering any
      // in-flight collaborative edits on this doc is acceptable.
      const snapshot = await ctx.runQuery(
        components.prosemirrorSync.lib.getSnapshot,
        { id: existing._id },
      );
      if (snapshot.content !== null) {
        await ctx.runMutation(components.prosemirrorSync.lib.deleteDocument, {
          id: existing._id,
        });
      }
      await prosemirrorSync.create(ctx, existing._id, planJson);
      await ctx.db.patch(existing._id, {
        content: session.planContent ?? "",
        contentUpdatedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    const docId = await ctx.db.insert("docs", {
      repoId: session.repoId,
      sessionId: args.sessionId,
      title: session.title,
      content: session.planContent ?? "",
      contentUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await prosemirrorSync.create(ctx, docId, planJson);
    return docId;
  },
});

/** Ensures a sync document exists for a legacy doc (lazy migration). */
export const ensureSyncDoc = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Doc not found");
    if (!(await hasRepoAccess(ctx.db, doc.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const existing = await ctx.runQuery(
      components.prosemirrorSync.lib.getSnapshot,
      { id: args.id },
    );
    if (existing.content !== null) return null;

    await prosemirrorSync.create(ctx, args.id, markdownToDocJson(doc.content));
    return null;
  },
});

/** Deletes a doc and all associated data. */
export const remove = authMutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }

    await ctx.runMutation(components.prosemirrorSync.lib.deleteDocument, {
      id: args.id,
    });

    const comments = await ctx.db
      .query("docComments")
      .withIndex("by_doc", (q) => q.eq("docId", args.id))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    const subscribers = await ctx.db
      .query("docSubscribers")
      .withIndex("by_doc", (q) => q.eq("docId", args.id))
      .collect();
    for (const sub of subscribers) {
      await ctx.db.delete(sub._id);
    }

    const versions = await ctx.db
      .query("docVersions")
      .withIndex("by_doc", (q) => q.eq("docId", args.id))
      .collect();
    for (const ver of versions) {
      await ctx.db.delete(ver._id);
    }

    const drafts = await ctx.db
      .query("docVersionDrafts")
      .withIndex("by_doc", (q) => q.eq("docId", args.id))
      .collect();
    for (const draft of drafts) {
      await ctx.db.delete(draft._id);
    }

    await ctx.db.delete(args.id);
    return null;
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

/** Looks up a PR recap doc by stable GitHub PR URL within a codebase. */
export const getByPrUrl = internalQuery({
  args: {
    repoId: v.id("githubRepos"),
    prUrl: v.string(),
  },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    const docsRepoId = await resolveCodebaseDocsRepoId(ctx.db, args.repoId);
    return await ctx.db
      .query("docs")
      .withIndex("by_repo_and_pr_url", (q) =>
        q.eq("repoId", docsRepoId).eq("prUrl", args.prUrl),
      )
      .first();
  },
});

/** Creates or updates a system-owned PR recap doc and resets its ProseMirror content. */
async function upsertPrRecapDocImpl(
  ctx: MutationCtx,
  args: {
    repoId: Id<"githubRepos">;
    prUrl: string;
    prNumber: number;
    title: string;
    headSha: string;
    content: string;
    prRecapStatus: "pending" | "ready" | "error";
    prRecapError?: string;
    clearActiveWorkflowId?: boolean;
  },
): Promise<Id<"docs">> {
  const now = Date.now();
  const docsRepoId = await resolveCodebaseDocsRepoId(ctx.db, args.repoId);
  const existing = await ctx.db
    .query("docs")
    .withIndex("by_repo_and_pr_url", (q) =>
      q.eq("repoId", docsRepoId).eq("prUrl", args.prUrl),
    )
    .first();

  const markdownJson = markdownToDocJson(args.content);

  if (existing) {
    const shouldSnapshot =
      existing.prRecapStatus === "ready" &&
      existing.content.trim().length > 0 &&
      existing.content !== args.content;

    if (shouldSnapshot) {
      const priorSnapshot = await ctx.runQuery(
        components.prosemirrorSync.lib.getSnapshot,
        { id: existing._id },
      );
      const pmContent =
        priorSnapshot.content !== null
          ? JSON.stringify(priorSnapshot.content)
          : JSON.stringify(markdownToDocJson(existing.content));
      await ctx.runMutation(internal.docVersions.saveRecapSnapshot, {
        docId: existing._id,
        title: existing.title,
        content: existing.content,
        pmContent,
        headSha: existing.headSha,
      });
    }

    const snapshot = await ctx.runQuery(
      components.prosemirrorSync.lib.getSnapshot,
      { id: existing._id },
    );
    if (snapshot.content !== null) {
      await ctx.runMutation(components.prosemirrorSync.lib.deleteDocument, {
        id: existing._id,
      });
    }
    await prosemirrorSync.create(ctx, existing._id, markdownJson);
    await ctx.db.patch(existing._id, {
      title: args.title,
      content: args.content,
      contentUpdatedAt: now,
      updatedAt: now,
      kind: "pr-recap",
      prUrl: args.prUrl,
      prNumber: args.prNumber,
      headSha: args.headSha,
      prRecapStatus: args.prRecapStatus,
      prRecapError:
        args.prRecapStatus === "ready" ? undefined : args.prRecapError,
      ...(args.clearActiveWorkflowId ? { activeWorkflowId: undefined } : {}),
    });
    return existing._id;
  }

  const docId = await ctx.db.insert("docs", {
    repoId: docsRepoId,
    kind: "pr-recap",
    title: args.title,
    content: args.content,
    prUrl: args.prUrl,
    prNumber: args.prNumber,
    headSha: args.headSha,
    prRecapStatus: args.prRecapStatus,
    prRecapError: args.prRecapError,
    contentUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await prosemirrorSync.create(ctx, docId, markdownJson);
  return docId;
}

export const upsertPrRecapDoc = internalMutation({
  args: {
    repoId: v.id("githubRepos"),
    prUrl: v.string(),
    prNumber: v.number(),
    title: v.string(),
    headSha: v.string(),
    content: v.string(),
    prRecapStatus: prRecapStatusValidator,
    prRecapError: v.optional(v.string()),
    clearActiveWorkflowId: v.optional(v.boolean()),
  },
  returns: v.id("docs"),
  handler: async (ctx, args) => upsertPrRecapDocImpl(ctx, args),
});

/** Patches PR recap status fields without rewriting ProseMirror content. */
export const patchPrRecapStatus = internalMutation({
  args: {
    docId: v.id("docs"),
    prRecapStatus: prRecapStatusValidator,
    prRecapError: v.optional(v.string()),
    headSha: v.optional(v.string()),
    activeWorkflowId: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) return null;

    const patch: {
      prRecapStatus: typeof args.prRecapStatus;
      prRecapError?: string;
      headSha?: string;
      activeWorkflowId?: string;
      updatedAt: number;
    } = {
      prRecapStatus: args.prRecapStatus,
      updatedAt: Date.now(),
    };

    if (args.prRecapError !== undefined) {
      patch.prRecapError = args.prRecapError;
    }
    if (args.headSha !== undefined) {
      patch.headSha = args.headSha;
    }
    if (args.activeWorkflowId !== undefined) {
      if (args.activeWorkflowId === null) {
        patch.activeWorkflowId = undefined;
      } else {
        patch.activeWorkflowId = args.activeWorkflowId;
      }
    }

    await ctx.db.patch(args.docId, patch);
    return null;
  },
});

const reviewerFeedbackItemValidator = v.object({
  anchorText: v.optional(v.string()),
  content: v.string(),
});

/**
 * Upserts a pending recap doc and starts prRecapWorkflow. Shared by the GitHub
 * webhook, MCP trigger, and manual "Revise recap" from agent-targeted comments.
 */
export const startPrRecap = internalMutation({
  args: {
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    installationId: v.number(),
    owner: v.string(),
    name: v.string(),
    prUrl: v.string(),
    prNumber: v.number(),
    prTitle: v.string(),
    headSha: v.string(),
    pendingPlaceholder: v.optional(v.string()),
    reviewerFeedback: v.optional(v.array(reviewerFeedbackItemValidator)),
    consumeAgentCommentIds: v.optional(v.array(v.id("docComments"))),
  },
  returns: v.object({
    docId: v.id("docs"),
    workflowId: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ docId: Id<"docs">; workflowId: string }> => {
    const docsRepoId = await resolveCodebaseDocsRepoId(ctx.db, args.repoId);
    const siblings = await findSiblingRepos(ctx.db, args.repoId);
    const workflowRepo =
      siblings.find((repo) => repo.rootDirectory === undefined) ??
      (await ctx.db.get(args.repoId));

    if (!workflowRepo) {
      throw new Error("Repository not found");
    }

    const placeholder =
      args.pendingPlaceholder ??
      (args.reviewerFeedback && args.reviewerFeedback.length > 0
        ? "_Revising recap from feedback…_"
        : "_Generating recap…_");

    const docId: Id<"docs"> = await upsertPrRecapDocImpl(ctx, {
      repoId: docsRepoId,
      prUrl: args.prUrl,
      prNumber: args.prNumber,
      title: `PR #${args.prNumber} — ${args.prTitle}`,
      headSha: args.headSha,
      content: placeholder,
      prRecapStatus: "pending",
    });

    const workflowId = await workflow.start(
      ctx,
      internal.prRecapWorkflow.prRecapWorkflow,
      {
        docId,
        repoId: workflowRepo._id,
        installationId: args.installationId,
        userId: args.userId,
        prNumber: args.prNumber,
        prUrl: args.prUrl,
        prTitle: args.prTitle,
        headSha: args.headSha,
        reviewerFeedback: args.reviewerFeedback,
        consumeAgentCommentIds: args.consumeAgentCommentIds,
      },
    );

    await trackDocWorkflow(ctx, docId, workflowId);

    return { docId, workflowId: String(workflowId) };
  },
});

/** Starts a recap revision workflow from queued agent-targeted comments. */
export const reviseRecapFromFeedback = authMutation({
  args: { docId: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || doc.kind !== "pr-recap") {
      throw new Error("PR recap not found");
    }
    if (!(await hasCodebaseRepoAccess(ctx.db, doc.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const pendingIds = doc.pendingAgentCommentIds ?? [];
    if (pendingIds.length === 0) {
      throw new Error("No pending agent feedback to revise from");
    }
    if (doc.activeWorkflowId) {
      throw new Error("A recap revision is already in progress");
    }
    if (
      doc.prUrl === undefined ||
      doc.prNumber === undefined ||
      doc.headSha === undefined
    ) {
      throw new Error("PR recap is missing pull request metadata");
    }

    const commentRows = await Promise.all(
      pendingIds.map((commentId) => ctx.db.get(commentId)),
    );
    const reviewerFeedback = commentRows
      .filter((comment) => comment !== null)
      .map((comment) => ({
        anchorText: comment.anchorText,
        content: comment.content,
      }));

    const siblings = await findSiblingRepos(ctx.db, doc.repoId);
    const workflowRepo =
      siblings.find((repo) => repo.rootDirectory === undefined) ?? siblings[0];
    if (!workflowRepo) {
      throw new Error("Repository not found");
    }

    const titleMatch = doc.title.match(/^PR #\d+ — (.+)$/);
    const prTitle = titleMatch ? titleMatch[1] : doc.title;

    await ctx.runMutation(internal.docs.startPrRecap, {
      repoId: workflowRepo._id,
      userId: ctx.userId,
      installationId: workflowRepo.installationId,
      owner: workflowRepo.owner,
      name: workflowRepo.name,
      prUrl: doc.prUrl,
      prNumber: doc.prNumber,
      prTitle,
      headSha: doc.headSha,
      reviewerFeedback,
      consumeAgentCommentIds: pendingIds,
    });

    return null;
  },
});
