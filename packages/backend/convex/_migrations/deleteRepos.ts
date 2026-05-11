import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

const STEPS = [
  "projects",
  "taskChildren",
  "tasks",
  "sessions",
  "docs",
  "designSessions",
  "snapshots",
  "automations",
  "flatTables",
  "repo",
] as const;

type Step = (typeof STEPS)[number];

/** Returns the next deletion step in the ordered pipeline, or null if done. */
function nextStep(current: Step): Step | null {
  const idx = STEPS.indexOf(current);
  if (idx === -1 || idx === STEPS.length - 1) return null;
  return STEPS[idx + 1];
}

/** Executes one step of the repo deletion pipeline and schedules the next step. */
export const deleteRepoStep = internalMutation({
  args: {
    repoId: v.id("githubRepos"),
    step: v.string(),
    totalDeleted: v.number(),
    repoLabel: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { repoId, step, totalDeleted, repoLabel }) => {
    const repo = await ctx.db.get(repoId);
    if (step !== "repo" && repo === null) {
      console.log(
        `[cleanup] ${repoLabel}: repo already deleted, skipping remaining steps`,
      );
      return null;
    }

    let deleted = 0;

    switch (step) {
      case "projects": {
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
        break;
      }

      case "taskChildren": {
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
            const logs = await ctx.db
              .query("agentRunActivityLogs")
              .withIndex("by_run", (q) => q.eq("runId", run._id))
              .collect();
            for (const log of logs) {
              await ctx.db.delete(log._id);
              deleted++;
            }
            await ctx.db.delete(run._id);
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
        }
        break;
      }

      case "tasks": {
        const tasks = await ctx.db
          .query("agentTasks")
          .withIndex("by_repo", (q) => q.eq("repoId", repoId))
          .collect();
        for (const task of tasks) {
          await ctx.db.delete(task._id);
          deleted++;
        }
        break;
      }

      case "sessions": {
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
        break;
      }

      case "docs": {
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
        break;
      }

      case "designSessions": {
        const dss = await ctx.db
          .query("designSessions")
          .withIndex("by_repo", (q) => q.eq("repoId", repoId))
          .collect();
        for (const ds of dss) {
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
        break;
      }

      case "snapshots": {
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
        break;
      }

      case "automations": {
        const automations = await ctx.db
          .query("automations")
          .withIndex("by_repo", (q) => q.eq("repoId", repoId))
          .collect();
        for (const automation of automations) {
          const runs = await ctx.db
            .query("automationRuns")
            .withIndex("by_automation", (q) =>
              q.eq("automationId", automation._id),
            )
            .collect();
          for (const r of runs) {
            await ctx.db.delete(r._id);
            deleted++;
          }
          await ctx.db.delete(automation._id);
          deleted++;
        }
        break;
      }

      case "flatTables": {
        const tables = [
          "designPersonas",
          "auditCategories",
          "notifications",
          "repoEnvVars",
          "evaluationReports",
          "logs",
        ] as const;
        for (const table of tables) {
          const rows = await ctx.db
            .query(table)
            .withIndex("by_repo", (q) => q.eq("repoId", repoId))
            .collect();
          for (const row of rows) {
            await ctx.db.delete(row._id);
            deleted++;
          }
        }
        break;
      }

      case "repo": {
        if (repo !== null) {
          await ctx.db.delete(repoId);
          deleted++;
        }
        const grand = totalDeleted + deleted;
        console.log(
          `[cleanup] ${repoLabel}: DONE — deleted ${grand} documents total`,
        );
        return null;
      }
    }

    const running = totalDeleted + deleted;
    console.log(
      `[cleanup] ${repoLabel}: step "${step}" — deleted ${deleted} docs (running total: ${running})`,
    );

    const next = nextStep(step as Step);
    if (next) {
      await ctx.scheduler.runAfter(0, internal.migrations.deleteRepoStep, {
        repoId,
        step: next,
        totalDeleted: running,
        repoLabel,
      });
    }

    return null;
  },
});

/** Schedules deletion of all repos not owned by "evalucom" (or vedantb2/eva). */
export const deleteNonEvalucomRepos = internalMutation({
  args: {},
  returns: v.object({ reposScheduled: v.number() }),
  handler: async (ctx) => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    const targets = allRepos.filter(
      (r) =>
        r.owner !== "evalucom" && !(r.owner === "vedantb2" && r.name === "eva"),
    );

    console.log(
      `[cleanup] Scheduling deletion for ${targets.length} non-evalucom repos`,
    );
    for (const repo of targets) {
      const label = `${repo.owner}/${repo.name}${repo.rootDirectory ? ` (${repo.rootDirectory})` : ""}`;
      await ctx.scheduler.runAfter(0, internal.migrations.deleteRepoStep, {
        repoId: repo._id,
        step: STEPS[0],
        totalDeleted: 0,
        repoLabel: label,
      });
    }

    return { reposScheduled: targets.length };
  },
});

/** Schedules deletion of all repos owned by "evalucom" (or vedantb2/eva). */
export const deleteEvalucomRepos = internalMutation({
  args: {},
  returns: v.object({ reposScheduled: v.number() }),
  handler: async (ctx) => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    const targets = allRepos.filter(
      (r) =>
        r.owner === "evalucom" || (r.owner === "vedantb2" && r.name === "eva"),
    );

    console.log(
      `[cleanup] Scheduling deletion for ${targets.length} evalucom repos`,
    );
    for (const repo of targets) {
      const label = `${repo.owner}/${repo.name}${repo.rootDirectory ? ` (${repo.rootDirectory})` : ""}`;
      await ctx.scheduler.runAfter(0, internal.migrations.deleteRepoStep, {
        repoId: repo._id,
        step: STEPS[0],
        totalDeleted: 0,
        repoLabel: label,
      });
    }

    return { reposScheduled: targets.length };
  },
});
