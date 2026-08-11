import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
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

/**
 * Recaps are generated on demand from the panel button, so the repo-level
 * toggle and pinned model are gone. Clears both values so the fields can leave
 * `githubRepoFields` — Convex rejects a schema that drops a field still held by
 * documents. Delete this once it has run on dev and prod.
 */
export const clearPrRecapConfig = dataMigrations.define({
  table: "githubRepos",
  parallelize: true,
  migrateOne: (_ctx, repo) => {
    if (repo.prRecapsEnabled === undefined && repo.prRecapModel === undefined) {
      return;
    }
    return { prRecapsEnabled: undefined, prRecapModel: undefined };
  },
});
