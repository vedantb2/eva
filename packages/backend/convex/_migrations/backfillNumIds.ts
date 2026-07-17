import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { DataModel, Id } from "../_generated/dataModel";
import type {
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import type { RepoEntityType } from "../numId";

const ENTITY_TYPES: RepoEntityType[] = [
  "sessions",
  "docs",
  "projects",
  "agentTasks",
  "designSessions",
  "automations",
];

type EntityTableName = RepoEntityType;

async function listEntitiesForRepo(
  db: GenericDatabaseReader<DataModel>,
  table: EntityTableName,
  repoId: Id<"githubRepos">,
) {
  switch (table) {
    case "sessions":
      return db
        .query("sessions")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
    case "docs":
      return db
        .query("docs")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
    case "projects":
      return db
        .query("projects")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
    case "agentTasks":
      return db
        .query("agentTasks")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
    case "designSessions":
      return db
        .query("designSessions")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
    case "automations":
      return db
        .query("automations")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
  }
}

async function backfillEntityTypeForRepo(
  db: GenericDatabaseWriter<DataModel>,
  repoId: Id<"githubRepos">,
  entityType: RepoEntityType,
): Promise<number> {
  const entities = await listEntitiesForRepo(db, entityType, repoId);
  const counter = await db
    .query("repoEntityCounters")
    .withIndex("by_repo_and_type", (q) =>
      q.eq("repoId", repoId).eq("entityType", entityType),
    )
    .first();

  const needsNumId = entities.filter((entity) => entity.numId === undefined);
  if (needsNumId.length === 0) {
    return counter?.nextNumId ?? 1;
  }

  const sorted = [...needsNumId].sort(
    (a, b) => a._creationTime - b._creationTime,
  );

  let nextNumId = counter?.nextNumId ?? 1;
  for (const entity of sorted) {
    await db.patch(entity._id, { numId: nextNumId });
    nextNumId += 1;
  }

  if (counter) {
    await db.patch(counter._id, { nextNumId });
  } else {
    await db.insert("repoEntityCounters", {
      repoId,
      entityType,
      nextNumId,
    });
  }

  return sorted.length;
}

/**
 * Backfills per-repo numIds for one entity type across all repos.
 * Schedules the next entity type until all six are done.
 * Safe to re-run; skips rows that already have numId.
 */
export const backfillNumIdsForEntityType = internalMutation({
  args: {
    entityTypeIndex: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entityType = ENTITY_TYPES[args.entityTypeIndex];
    if (!entityType) {
      console.log("[migration] backfillNumIds: complete");
      return null;
    }

    const repos = await ctx.db.query("githubRepos").collect();
    let patched = 0;
    for (const repo of repos) {
      patched += await backfillEntityTypeForRepo(ctx.db, repo._id, entityType);
    }

    console.log(
      `[migration] backfillNumIds ${entityType}: patched ${patched} rows across ${repos.length} repos`,
    );

    const nextIndex = args.entityTypeIndex + 1;
    if (nextIndex < ENTITY_TYPES.length) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.backfillNumIdsForEntityType,
        { entityTypeIndex: nextIndex },
      );
    }

    return null;
  },
});

/** Entry point — starts the per-entity-type backfill chain. */
export const backfillNumIds = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.backfillNumIdsForEntityType,
      {
        entityTypeIndex: 0,
      },
    );
    return null;
  },
});
