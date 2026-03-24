import { internalMutation, type MutationCtx } from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";

export const cleanupStaleRuns = internalMutation({
  args: {},
  returns: v.object({ tasksFixed: v.number(), runsFixed: v.number() }),
  handler: async (ctx) => {
    let tasksFixed = 0;
    let runsFixed = 0;
    const cutoff = Date.now() - RUN_TIMEOUT_MS;

    const allTasks = await ctx.db.query("agentTasks").collect();
    const stuckTasks = allTasks.filter((t) => t.status === "in_progress");

    for (const task of stuckTasks) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();

      const activeRuns = runs.filter(
        (r) => r.status === "queued" || r.status === "running",
      );
      const hasFreshActiveRun = activeRuns.some(
        (r) => (r.startedAt ?? 0) >= cutoff,
      );
      const staleActiveRuns = activeRuns.filter(
        (r) => (r.startedAt ?? 0) < cutoff,
      );

      if (hasFreshActiveRun) continue;

      if (
        activeRuns.length === 0 &&
        !runs.some((r) => r.status === "success" || r.status === "error")
      )
        continue;

      if (task.activeWorkflowId) {
        try {
          await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
        } catch {}
      }

      for (const staleRun of staleActiveRuns) {
        await ctx.db.patch(staleRun._id, {
          status: "error",
          error: "Cleaned up stale run",
          finishedAt: Date.now(),
        });
        runsFixed++;
      }

      const hasSuccessRun = runs.some((r) => r.status === "success");
      await ctx.db.patch(task._id, {
        status: hasSuccessRun ? "code_review" : "todo",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
      tasksFixed++;

      const audits = await ctx.db
        .query("audits")
        .withIndex("by_entity", (q) => q.eq("entityId", task._id))
        .collect();
      for (const audit of audits) {
        if (audit.status === "running") {
          await ctx.db.patch(audit._id, {
            status: "error",
            error: "Cleaned up stale audit",
          });
        }
      }

      for (const entityId of [String(task._id), `audit-${String(task._id)}`]) {
        const streaming = await ctx.db
          .query("streamingActivity")
          .withIndex("by_entity", (q) => q.eq("entityId", entityId))
          .first();
        if (streaming) await ctx.db.delete(streaming._id);
      }
    }

    return { tasksFixed, runsFixed };
  },
});

async function deleteAllForRepo(ctx: MutationCtx, repoId: Id<"githubRepos">) {
  let deleted = 0;

  const projects = await ctx.db
    .query("projects")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  for (const project of projects) {
    const details = await ctx.db
      .query("projectDetails")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();
    for (const d of details) {
      await ctx.db.delete(d._id);
      deleted++;
    }
    await ctx.db.delete(project._id);
    deleted++;
  }

  const tasks = await ctx.db
    .query("agentTasks")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  for (const task of tasks) {
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();
    for (const run of runs) {
      const activityLogs = await ctx.db
        .query("agentRunActivityLogs")
        .withIndex("by_run", (q) => q.eq("runId", run._id))
        .collect();
      for (const log of activityLogs) {
        await ctx.db.delete(log._id);
        deleted++;
      }
      await ctx.db.delete(run._id);
      deleted++;
    }

    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", task._id))
      .collect();
    for (const s of subtasks) {
      await ctx.db.delete(s._id);
      deleted++;
    }

    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();
    for (const c of comments) {
      await ctx.db.delete(c._id);
      deleted++;
    }

    const proofs = await ctx.db
      .query("taskProof")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();
    for (const p of proofs) {
      await ctx.db.delete(p._id);
      deleted++;
    }

    const deps = await ctx.db
      .query("taskDependencies")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();
    for (const d of deps) {
      await ctx.db.delete(d._id);
      deleted++;
    }

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", task._id))
      .collect();
    for (const a of audits) {
      await ctx.db.delete(a._id);
      deleted++;
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(task._id)))
      .collect();
    for (const s of streaming) {
      await ctx.db.delete(s._id);
      deleted++;
    }

    await ctx.db.delete(task._id);
    deleted++;
  }

  const sessions = await ctx.db
    .query("sessions")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  for (const session of sessions) {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", session._id))
      .collect();
    for (const m of messages) {
      await ctx.db.delete(m._id);
      deleted++;
    }

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", session._id))
      .collect();
    for (const a of audits) {
      await ctx.db.delete(a._id);
      deleted++;
    }

    await ctx.db.delete(session._id);
    deleted++;
  }

  const docs = await ctx.db
    .query("docs")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  for (const doc of docs) {
    const evalReports = await ctx.db
      .query("evaluationReports")
      .withIndex("by_doc", (q) => q.eq("docId", doc._id))
      .collect();
    for (const e of evalReports) {
      await ctx.db.delete(e._id);
      deleted++;
    }
    await ctx.db.delete(doc._id);
    deleted++;
  }

  const researchQueries = await ctx.db
    .query("researchQueries")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  for (const rq of researchQueries) {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", rq._id))
      .collect();
    for (const m of messages) {
      await ctx.db.delete(m._id);
      deleted++;
    }
    await ctx.db.delete(rq._id);
    deleted++;
  }

  const designSessions = await ctx.db
    .query("designSessions")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  for (const ds of designSessions) {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", ds._id))
      .collect();
    for (const m of messages) {
      await ctx.db.delete(m._id);
      deleted++;
    }
    await ctx.db.delete(ds._id);
    deleted++;
  }

  const snapshots = await ctx.db
    .query("repoSnapshots")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  for (const snapshot of snapshots) {
    const builds = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repo_snapshot", (q) =>
        q.eq("repoSnapshotId", snapshot._id),
      )
      .collect();
    for (const b of builds) {
      await ctx.db.delete(b._id);
      deleted++;
    }
    await ctx.db.delete(snapshot._id);
    deleted++;
  }

  const automations = await ctx.db
    .query("automations")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  for (const automation of automations) {
    const runs = await ctx.db
      .query("automationRuns")
      .withIndex("by_automation", (q) => q.eq("automationId", automation._id))
      .collect();
    for (const r of runs) {
      await ctx.db.delete(r._id);
      deleted++;
    }
    await ctx.db.delete(automation._id);
    deleted++;
  }

  const flatTables = [
    "savedQueries",
    "routines",
    "designPersonas",
    "auditCategories",
    "notifications",
    "repoEnvVars",
    "evaluationReports",
    "logs",
  ] as const;
  for (const table of flatTables) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
      deleted++;
    }
  }

  await ctx.db.delete(repoId);
  deleted++;
  return deleted;
}

export const deleteNonEvalucomRepos = internalMutation({
  args: {},
  returns: v.object({
    reposDeleted: v.number(),
    totalDocumentsDeleted: v.number(),
  }),
  handler: async (ctx) => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    const targets = allRepos.filter((r) => r.owner !== "evalucom");

    let totalDeleted = 0;
    for (const repo of targets) {
      totalDeleted += await deleteAllForRepo(ctx, repo._id);
    }

    return {
      reposDeleted: targets.length,
      totalDocumentsDeleted: totalDeleted,
    };
  },
});

export const deleteEvalucomRepos = internalMutation({
  args: {},
  returns: v.object({
    reposDeleted: v.number(),
    totalDocumentsDeleted: v.number(),
  }),
  handler: async (ctx) => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    const targets = allRepos.filter((r) => r.owner === "evalucom");

    let totalDeleted = 0;
    for (const repo of targets) {
      totalDeleted += await deleteAllForRepo(ctx, repo._id);
    }

    return {
      reposDeleted: targets.length,
      totalDocumentsDeleted: totalDeleted,
    };
  },
});
