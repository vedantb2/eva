import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import type { DataModel, Doc } from "./_generated/dataModel";
import schema from "./schema";

/**
 * Convex Migrations component — batched online migrations with progress,
 * resume, dry-run, and cancel. Prefer this over hand-rolled paginated
 * internalMutations for table-wide backfills.
 *
 * Hand-rolled one-offs still live under `_migrations/` and are re-exported
 * from `migrations.ts`. New table sweeps should `define` here instead.
 *
 * Docs: https://www.convex.dev/components/migrations
 *
 * Examples:
 *   export const setDefault = dataMigrations.define({
 *     table: "users",
 *     migrateOne: async (ctx, doc) => {
 *       if (doc.someField === undefined) {
 *         return { someField: "default" };
 *       }
 *     },
 *   });
 *
 *   npx convex run dataMigrations:setDefault '{dryRun: true}'
 *   npx convex run dataMigrations:setDefault
 *   npx convex run dataMigrations:run '{fn: "dataMigrations:setDefault"}'
 *   npx convex run --component migrations lib:getStatus --watch
 *   npx convex run --component migrations lib:cancel '{name: "dataMigrations:setDefault"}'
 */
// The second type argument is not optional here: `Migrations` defaults it to
// `void`, and `customRange` resolves its index field types through it.
export const dataMigrations = new Migrations<DataModel, typeof schema>(
  components.migrations,
  {
    migrationsLocationPrefix: "dataMigrations:",
    // Required by any `define` that sets `customRange` — the paginator needs
    // the schema to resolve the index it ranges over.
    schema,
  },
);

/** Generic runner: `npx convex run dataMigrations:run '{fn:"dataMigrations:…"}'`. */
export const run = dataMigrations.runner();

/** Backfills compact task latest-run rows so list queries stop reading run logs. */
export const backfillAgentTaskRunSummaries = dataMigrations.define({
  table: "agentTasks",
  migrateOne: async (ctx, task) => {
    if (!task.repoId) return;
    const existing = await ctx.db
      .query("agentTaskRunSummaries")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .unique();
    if (existing) return;

    const latestRun = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .order("desc")
      .first();
    await ctx.db.insert("agentTaskRunSummaries", {
      taskId: task._id,
      repoId: task.repoId,
      lastRunStartedAt: latestRun?.startedAt,
    });
  },
});

/** Moves large SKILL.md bodies out of rows read by repoSkills.listByRepo. */
export const splitRepoSkillContent = dataMigrations.define({
  table: "repoSkills",
  migrateOne: async (ctx, skill) => {
    if (!skill.content) return;
    const existing = await ctx.db
      .query("repoSkillContents")
      .withIndex("by_skill", (q) => q.eq("skillId", skill._id))
      .unique();
    if (existing) {
      if (existing.content !== skill.content) {
        await ctx.db.patch(existing._id, { content: skill.content });
      }
    } else {
      await ctx.db.insert("repoSkillContents", {
        skillId: skill._id,
        content: skill.content,
      });
    }
    await ctx.db.patch(skill._id, { content: undefined });
  },
});

/** Deletes rows left by the removed durable turn-lifecycle architecture. */
export const deleteRetiredTurns = dataMigrations.define({
  table: "turns",
  migrateOne: async (ctx, turn) => {
    await ctx.db.delete(turn._id);
  },
});

function withoutRetiredTurnId(
  pendingTurn: NonNullable<Doc<"sessions">["pendingTurn"]>,
) {
  return {
    prompt: pendingTurn.prompt,
    requestedAt: pendingTurn.requestedAt,
    ...(pendingTurn.attachmentStorageIds === undefined
      ? {}
      : { attachmentStorageIds: pendingTurn.attachmentStorageIds }),
    ...(pendingTurn.model === undefined ? {} : { model: pendingTurn.model }),
  };
}

/** Clears the rollout marker and any staged Turn reference from sessions. */
export const clearRetiredSessionTurnFields = dataMigrations.define({
  table: "sessions",
  migrateOne: (ctx, session) => {
    void ctx;
    return {
      turnLifecycleVersion: undefined,
      ...(session.pendingTurn?.turnId === undefined
        ? {}
        : { pendingTurn: withoutRetiredTurnId(session.pendingTurn) }),
    };
  },
});

/** Clears staged Turn references from the session daemon side table. */
export const clearRetiredSessionDaemonTurnFields = dataMigrations.define({
  table: "sessionDaemonStates",
  migrateOne: (ctx, daemon) => {
    void ctx;
    return daemon.pendingTurn?.turnId === undefined
      ? undefined
      : { pendingTurn: withoutRetiredTurnId(daemon.pendingTurn) };
  },
});

/** Clears staged Turn references from project sandbox chat state. */
export const clearRetiredProjectTurnFields = dataMigrations.define({
  table: "projects",
  migrateOne: (ctx, project) => {
    void ctx;
    return project.pendingTurn?.turnId === undefined
      ? undefined
      : { pendingTurn: withoutRetiredTurnId(project.pendingTurn) };
  },
});

/** Clears staged Turn references from task sandbox chat state. */
export const clearRetiredTaskTurnFields = dataMigrations.define({
  table: "agentTasks",
  migrateOne: (ctx, task) => {
    void ctx;
    return task.pendingTurn?.turnId === undefined
      ? undefined
      : { pendingTurn: withoutRetiredTurnId(task.pendingTurn) };
  },
});
