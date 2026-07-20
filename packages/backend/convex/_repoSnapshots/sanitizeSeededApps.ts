import type { Id } from "../_generated/dataModel";

export type SeededAppReturn = {
  repoId: Id<"githubRepos">;
  seededSnapshotName: string | null;
  app?: string;
  status?: "running" | "seeded" | "fallback";
};

/** Legacy rows may still carry warmup fields that fail return validators. */
export type SeededAppInput = SeededAppReturn & {
  warmupStatus?: string;
};

/** Drops legacy warmup fields still present on older prod rows. */
export function sanitizeSeededApps(
  seededApps: SeededAppInput[] | undefined,
): SeededAppReturn[] | undefined {
  if (seededApps === undefined) {
    return undefined;
  }
  return seededApps.map((app) => {
    const cleaned: SeededAppReturn = {
      repoId: app.repoId,
      seededSnapshotName: app.seededSnapshotName,
    };
    if (app.app !== undefined) {
      cleaned.app = app.app;
    }
    if (app.status !== undefined) {
      cleaned.status = app.status;
    }
    return cleaned;
  });
}
