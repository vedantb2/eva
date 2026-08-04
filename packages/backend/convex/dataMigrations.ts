import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
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

/** Gives every pre-identity queued row a deterministic, rerunnable turn key. */
export const backfillQueuedTurnIds = dataMigrations.define({
  table: "queuedMessages",
  migrateOne: (_ctx, message) => {
    if (message.turnId !== undefined) return;
    return { turnId: `legacy-queue:${String(message._id)}` };
  },
});

/** Adds stable event identity to project-interview transcript rows. */
export const backfillProjectConversationMessageIds = dataMigrations.define({
  table: "projectDetails",
  migrateOne: (_ctx, details) => {
    if (
      details.conversationHistory.every((message) => message.id !== undefined)
    ) {
      return;
    }
    return {
      conversationHistory: details.conversationHistory.map((message, index) =>
        message.id !== undefined
          ? message
          : {
              ...message,
              id: `legacy-interview:${String(details._id)}:${index}`,
            },
      ),
    };
  },
});
