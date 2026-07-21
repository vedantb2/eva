import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { authMutation } from "../functions";
import { RUN_TIMEOUT_MS } from "../workflowWatchdog";
import { resolveCanonicalRepoId } from "../_githubRepos/helpers";
import {
  extractJsonBlock,
  recordCompletionLog,
} from "../_taskWorkflow/helpers";
import {
  parseSectionsFromJson,
  extractSummaryFromJson,
} from "../_taskWorkflow/auditParser";
import type { Id } from "../_generated/dataModel";

/**
 * Inserts a running audit row and schedules the sandbox audit + stale watchdog
 * for a task/project sandbox chat. Idempotent guards live in the callers. Skips
 * silently (no row) when an audit is already running for the entity or the repo
 * has no enabled categories — so a repo without categories never accrues
 * errored audit rows on every chat turn.
 */
async function startChatAudit(
  ctx: MutationCtx,
  opts: {
    entityId: Id<"agentTasks"> | Id<"projects">;
    repoId: Id<"githubRepos">;
    sandboxId: string;
    userId: Id<"users">;
    runArgs: { taskId: Id<"agentTasks"> } | { projectId: Id<"projects"> };
  },
): Promise<void> {
  const existing = await ctx.db
    .query("audits")
    .withIndex("by_entity", (q) => q.eq("entityId", opts.entityId))
    .collect();
  if (existing.some((a) => a.status === "running")) return;

  const canonicalId = await resolveCanonicalRepoId(ctx.db, opts.repoId);
  const enabledCategory = await ctx.db
    .query("auditCategories")
    .withIndex("by_repo_and_enabled", (q) =>
      q.eq("repoId", canonicalId).eq("enabled", true),
    )
    .first();
  if (enabledCategory === null) return;

  const auditId = await ctx.db.insert("audits", {
    entityId: opts.entityId,
    status: "running",
    sections: [],
    createdAt: Date.now(),
  });

  await ctx.scheduler.runAfter(0, internal.daytona.runChatAudit, {
    ...opts.runArgs,
    repoId: opts.repoId,
    sandboxId: opts.sandboxId,
    auditId,
    userId: opts.userId,
  });

  await ctx.scheduler.runAfter(
    RUN_TIMEOUT_MS,
    internal.workflowWatchdog.handleStaleAudit,
    { auditId },
  );
}

/** Fires an audit after a task sandbox-chat turn when the task has it enabled. */
export const maybeStartTaskChatAudit = internalMutation({
  args: { taskId: v.id("agentTasks"), userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    if (task.chatRunAuditEnabled !== true) return null;
    if (!task.sandboxId || !task.repoId) return null;
    await startChatAudit(ctx, {
      entityId: args.taskId,
      repoId: task.repoId,
      sandboxId: task.sandboxId,
      userId: args.userId,
      runArgs: { taskId: args.taskId },
    });
    return null;
  },
});

/** Fires an audit after a project sandbox-chat turn when the project has it enabled. */
export const maybeStartProjectChatAudit = internalMutation({
  args: { projectId: v.id("projects"), userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    if (project.chatRunAuditEnabled !== true) return null;
    if (!project.sandboxId) return null;
    await startChatAudit(ctx, {
      entityId: args.projectId,
      repoId: project.repoId,
      sandboxId: project.sandboxId,
      userId: args.userId,
      runArgs: { projectId: args.projectId },
    });
    return null;
  },
});

/**
 * Completion callback for a task/project chat audit. The sandbox posts the
 * entity id under its field name ("taskId"/"projectId"); we resolve the running
 * audit for that entity and parse/patch it. Mirrors handleSessionCompletion
 * minus the PR append (chat audits surface in the audits table / chat panel).
 */
export const handleChatAuditCompletion = authMutation({
  args: {
    taskId: v.optional(v.id("agentTasks")),
    projectId: v.optional(v.id("projects")),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entityId = args.taskId ?? args.projectId;
    if (!entityId) return null;

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", entityId))
      .collect();
    const audit = audits.find((a) => a.status === "running");
    if (!audit) return null;

    if (!args.success || !args.result) {
      await ctx.db.patch(audit._id, {
        status: "error",
        error: args.error ?? "Audit failed",
        completedAt: Date.now(),
      });
      return null;
    }

    try {
      const raw: unknown = JSON.parse(extractJsonBlock(args.result));
      await ctx.db.patch(audit._id, {
        status: "completed",
        sections: parseSectionsFromJson(raw),
        summary: extractSummaryFromJson(raw),
        completedAt: Date.now(),
      });
    } catch {
      await ctx.db.patch(audit._id, {
        status: "error",
        error: "Failed to parse audit JSON",
        completedAt: Date.now(),
      });
    }

    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (task?.repoId) {
        await recordCompletionLog(ctx, {
          entityType: "sessionAudit",
          entityId: String(args.taskId),
          entityTitle: `Audit: ${task.title}`,
          repoId: task.repoId,
          rawResultEvent: args.rawResultEvent,
        });
      }
    } else if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        await recordCompletionLog(ctx, {
          entityType: "sessionAudit",
          entityId: String(args.projectId),
          entityTitle: `Audit: ${project.title}`,
          repoId: project.repoId,
          rawResultEvent: args.rawResultEvent,
        });
      }
    }

    return null;
  },
});
