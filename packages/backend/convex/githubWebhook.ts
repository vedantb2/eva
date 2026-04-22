import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { createNotification } from "./notifications";
import type { Doc, Id } from "./_generated/dataModel";
import { buildProjectBranchName } from "./_projects/helpers";

const QUICK_TASK_BRANCH_PREFIX = "eva/task-";
const PROJECT_BRANCH_PREFIX = "eva/project-";

/**
 * Recovers an agentRun from an Eva-conventional branch name when the merge
 * webhook arrives without a PR URL match. Returns the most recent run on the
 * matching task (or any task in the project), or null if the branch doesn't
 * parse or the task/project no longer exists.
 */
async function findRunByBranchName(
  ctx: MutationCtx,
  branchName: string,
): Promise<Doc<"agentRuns"> | null> {
  if (branchName.startsWith(QUICK_TASK_BRANCH_PREFIX)) {
    const candidate = branchName.slice(QUICK_TASK_BRANCH_PREFIX.length);
    const taskId = ctx.db.normalizeId("agentTasks", candidate);
    if (!taskId) return null;
    return await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .order("desc")
      .first();
  }

  if (branchName.startsWith(PROJECT_BRANCH_PREFIX)) {
    // Strip the optional `-vN` suffix so the remainder is the raw project id.
    const candidate = branchName
      .slice(PROJECT_BRANCH_PREFIX.length)
      .replace(/-v\d+$/, "");
    const projectId = ctx.db.normalizeId("projects", candidate);
    if (!projectId) return null;
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const task of tasks) {
      const run = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .order("desc")
        .first();
      if (run) return run;
    }
    return null;
  }

  return null;
}

/** Handles a PR closed webhook event, updating related tasks and projects based on merge status. */
export const handlePrClosed = internalMutation({
  args: {
    prUrl: v.string(),
    merged: v.boolean(),
    branchName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("githubWebhookEvents", {
      event: "pull_request",
      action: "closed",
      prUrl: args.prUrl,
      merged: args.merged,
      status: "pending",
      createdAt: Date.now(),
    });

    let run = await ctx.db
      .query("agentRuns")
      .withIndex("by_pr_url", (q) => q.eq("prUrl", args.prUrl))
      .first();

    // Fallback: no run has this PR URL recorded (e.g. the URL was dropped
    // during PR creation if a downstream call like addLabels failed). Eva
    // branches are deterministically named — `eva/task-<taskId>` for quick
    // tasks and `eva/project-<projectId>[-vN]` for project tasks — so we can
    // recover the run by parsing the branch and heal the link for next time.
    if (!run && args.branchName) {
      run = await findRunByBranchName(ctx, args.branchName);
      if (run) {
        await ctx.db.patch(run._id, { prUrl: args.prUrl });
      }
    }

    if (!run) {
      await ctx.db.patch(eventId, { status: "skipped" });
      return null;
    }

    const task = await ctx.db.get(run.taskId);
    if (!task || task.status === "done" || task.status === "cancelled") {
      await ctx.db.patch(eventId, { status: "skipped" });
      return null;
    }

    const newStatus = args.merged ? "done" : "cancelled";
    const now = Date.now();

    const tasksToUpdate = task.projectId
      ? await ctx.db
          .query("agentTasks")
          .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
          .collect()
      : [task];

    for (const t of tasksToUpdate) {
      if (t.status === "done" || t.status === "cancelled") continue;

      await ctx.db.patch(t._id, {
        status: newStatus,
        updatedAt: now,
      });

      if (t.scheduledFunctionId) {
        try {
          await ctx.scheduler.cancel(t.scheduledFunctionId);
        } catch {
          // may have already fired
        }
        await ctx.db.patch(t._id, {
          scheduledAt: undefined,
          scheduledFunctionId: undefined,
        });
      }

      const notifyUsers = new Set(
        [t.createdBy, t.assignedTo].filter(
          (id): id is Id<"users"> => id !== undefined,
        ),
      );
      const notificationTitle = args.merged
        ? `PR merged — "${t.title}" moved to done`
        : `PR closed — "${t.title}" moved to cancelled`;
      const notificationMessage = args.merged
        ? `GitHub merged ${args.prUrl}. Task moved to done.`
        : `GitHub closed ${args.prUrl} without merge. Task moved to cancelled.`;
      for (const userId of notifyUsers) {
        await createNotification(ctx, {
          userId,
          type: args.merged ? "task_complete" : "system",
          title: notificationTitle,
          message: notificationMessage,
          repoId: t.repoId,
          projectId: t.projectId,
          taskId: t._id,
        });
      }

      const commentText = args.merged
        ? "PR was merged on GitHub. Task moved to done."
        : "PR was closed without merging on GitHub. Task moved to cancelled.";
      await ctx.runMutation(internal.taskComments.createSystemComment, {
        taskId: t._id,
        content: commentText,
      });
    }

    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      const newPhase = args.merged ? "completed" : "cancelled";
      if (args.merged && project) {
        const nextVersion = (project.branchVersion ?? 1) + 1;
        if (project.sandboxId) {
          await ctx.scheduler.runAfter(0, internal.daytona.deleteSandbox, {
            sandboxId: project.sandboxId,
            repoId: project.repoId,
          });
        }
        await ctx.db.patch(task.projectId, {
          phase: newPhase,
          sandboxId: undefined,
          lastSandboxActivity: undefined,
          branchVersion: nextVersion,
          branchName: buildProjectBranchName(task.projectId, nextVersion),
          prUrl: undefined,
        });
      } else {
        await ctx.db.patch(task.projectId, { phase: newPhase });
      }
    }

    await ctx.db.patch(eventId, {
      status: "completed",
      taskId: task._id,
    });

    return null;
  },
});
