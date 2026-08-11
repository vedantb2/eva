import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

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
export const dataMigrations = new Migrations<DataModel>(components.migrations, {
  migrationsLocationPrefix: "dataMigrations:",
});

/** Generic runner: `npx convex run dataMigrations:run '{fn:"dataMigrations:…"}'`. */
export const run = dataMigrations.runner();

/* -------------------------------------------------------------------------
 * Proof capture + audit removal.
 *
 * The subsystem's code is gone; these sweeps clear the data it left behind so
 * the schema can drop the tables and fields. Field clearing only works while
 * the schema still marks those fields `v.optional`, which is why the schema
 * drop is a separate, later deploy.
 *
 * Run with `removeProofAndAudit` at the bottom. Delete this whole block —
 * definitions and runner — once every deployment reports complete, since the
 * `undefined` field patches stop typechecking the moment the fields leave
 * `_validators/tableFields.ts`.
 * ---------------------------------------------------------------------- */

/**
 * Proof rows own uploaded screenshots and recordings, so each one costs a
 * storage delete as well as a document delete. Smaller batches keep that
 * inside a single transaction's budget.
 */
export const removeProofAndAuditTaskProof = dataMigrations.define({
  table: "taskProof",
  batchSize: 25,
  migrateOne: async (ctx, doc) => {
    if (doc.storageId) {
      await ctx.storage.delete(doc.storageId);
    }
    await ctx.db.delete(doc._id);
  },
});

export const removeProofAndAuditAudits = dataMigrations.define({
  table: "audits",
  migrateOne: async (ctx, doc) => {
    await ctx.db.delete(doc._id);
  },
});

export const removeProofAndAuditCategories = dataMigrations.define({
  table: "auditCategories",
  migrateOne: async (ctx, doc) => {
    await ctx.db.delete(doc._id);
  },
});

/** Covers drafts too — `status: "draft"` tasks live in this same table. */
export const removeProofAndAuditTaskFields = dataMigrations.define({
  table: "agentTasks",
  migrateOne: (_ctx, doc) => {
    if (
      doc.screenshotsVideosEnabled === undefined &&
      doc.runAuditEnabled === undefined &&
      doc.chatCaptureProofEnabled === undefined &&
      doc.chatRunAuditEnabled === undefined
    ) {
      return;
    }
    return {
      screenshotsVideosEnabled: undefined,
      runAuditEnabled: undefined,
      chatCaptureProofEnabled: undefined,
      chatRunAuditEnabled: undefined,
    };
  },
});

export const removeProofAndAuditRunFields = dataMigrations.define({
  table: "agentRuns",
  migrateOne: (_ctx, doc) => {
    if (
      doc.screenshotsVideosEnabled === undefined &&
      doc.runAuditEnabled === undefined
    ) {
      return;
    }
    return {
      screenshotsVideosEnabled: undefined,
      runAuditEnabled: undefined,
    };
  },
});

export const removeProofAndAuditProjectFields = dataMigrations.define({
  table: "projects",
  migrateOne: (_ctx, doc) => {
    if (
      doc.screenshotsVideosEnabled === undefined &&
      doc.runAuditEnabled === undefined &&
      doc.chatCaptureProofEnabled === undefined &&
      doc.chatRunAuditEnabled === undefined
    ) {
      return;
    }
    return {
      screenshotsVideosEnabled: undefined,
      runAuditEnabled: undefined,
      chatCaptureProofEnabled: undefined,
      chatRunAuditEnabled: undefined,
    };
  },
});

export const removeProofAndAuditSessionFields = dataMigrations.define({
  table: "sessions",
  migrateOne: (_ctx, doc) => {
    if (
      doc.captureProofEnabled === undefined &&
      doc.runAuditEnabled === undefined
    ) {
      return;
    }
    return {
      captureProofEnabled: undefined,
      runAuditEnabled: undefined,
    };
  },
});

export const removeProofAndAuditRepoModelFields = dataMigrations.define({
  table: "githubRepos",
  migrateOne: (_ctx, doc) => {
    if (
      doc.auditReviewModel === undefined &&
      doc.auditFixModel === undefined &&
      doc.proofModel === undefined
    ) {
      return;
    }
    return {
      auditReviewModel: undefined,
      auditFixModel: undefined,
      proofModel: undefined,
    };
  },
});

/**
 * `type` narrows to `"run"` in the schema drop, so every other kind has to go.
 * No index on `type` alone, so this one scans.
 */
export const removeProofAndAuditActivityLogs = dataMigrations.define({
  table: "agentRunActivityLogs",
  migrateOne: async (ctx, doc) => {
    if (doc.type === "proof" || doc.type === "audit" || doc.type === "fix") {
      await ctx.db.delete(doc._id);
    }
  },
});

/**
 * `logs` is large, so each entity type gets its own migration scoped to the
 * `by_entity_type` index rather than one sweep over the whole table.
 */
export const removeProofAndAuditTaskProofLogs = dataMigrations.define({
  table: "logs",
  customRange: (q) =>
    q.withIndex("by_entity_type", (idx) => idx.eq("entityType", "taskProof")),
  migrateOne: async (ctx, doc) => {
    await ctx.db.delete(doc._id);
  },
});

export const removeProofAndAuditTaskAuditLogs = dataMigrations.define({
  table: "logs",
  customRange: (q) =>
    q.withIndex("by_entity_type", (idx) => idx.eq("entityType", "taskAudit")),
  migrateOne: async (ctx, doc) => {
    await ctx.db.delete(doc._id);
  },
});

export const removeProofAndAuditSessionAuditLogs = dataMigrations.define({
  table: "logs",
  customRange: (q) =>
    q.withIndex("by_entity_type", (idx) =>
      idx.eq("entityType", "sessionAudit"),
    ),
  migrateOne: async (ctx, doc) => {
    await ctx.db.delete(doc._id);
  },
});

/**
 * Orphan hygiene: audit streaming rows were keyed `task-audit-run-<runId>` and
 * `audit-<entityId>`, and nothing clears them now the writers are gone. The
 * table only ever holds live entities, so a full scan is cheap.
 */
export const removeProofAndAuditStreaming = dataMigrations.define({
  table: "streamingActivity",
  migrateOne: async (ctx, doc) => {
    if (
      doc.entityId.startsWith("task-audit-run-") ||
      doc.entityId.startsWith("audit-")
    ) {
      await ctx.db.delete(doc._id);
    }
  },
});

/** `npx convex run dataMigrations:removeProofAndAudit '{"dryRun":true}'` first. */
export const removeProofAndAudit = dataMigrations.runner([
  internal.dataMigrations.removeProofAndAuditTaskProof,
  internal.dataMigrations.removeProofAndAuditAudits,
  internal.dataMigrations.removeProofAndAuditCategories,
  internal.dataMigrations.removeProofAndAuditTaskFields,
  internal.dataMigrations.removeProofAndAuditRunFields,
  internal.dataMigrations.removeProofAndAuditProjectFields,
  internal.dataMigrations.removeProofAndAuditSessionFields,
  internal.dataMigrations.removeProofAndAuditRepoModelFields,
  internal.dataMigrations.removeProofAndAuditActivityLogs,
  internal.dataMigrations.removeProofAndAuditTaskProofLogs,
  internal.dataMigrations.removeProofAndAuditTaskAuditLogs,
  internal.dataMigrations.removeProofAndAuditSessionAuditLogs,
  internal.dataMigrations.removeProofAndAuditStreaming,
]);
