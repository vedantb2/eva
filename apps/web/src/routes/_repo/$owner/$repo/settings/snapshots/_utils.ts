import type { FunctionReturnType } from "convex/server";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";

/** Snapshot config document, as returned by repoSnapshots.getRepoSnapshot. */
export type RepoSnapshot = NonNullable<
  FunctionReturnType<typeof api.repoSnapshots.getRepoSnapshot>
>;

/** A single build row, as returned by repoSnapshots.listBuilds. */
export type SnapshotBuild = FunctionReturnType<
  typeof api.repoSnapshots.listBuilds
>[number];

/** Per-build seeding outcome for one app, embedded in SnapshotBuild.seededApps. */
export type SeededBuildApp = NonNullable<SnapshotBuild["seededApps"]>[number];

/** Live per-app seeded-snapshot status, as returned by repoSnapshots.getSeededAppStatus. */
export type SeededAppStatus = FunctionReturnType<
  typeof api.repoSnapshots.getSeededAppStatus
>[number];

/**
 * Chunk size for splitting large file uploads. Convex enforces a 2-minute
 * server-side timeout on upload POSTs, so a 600MB single upload reliably stalls
 * once the server stops draining the TCP receive buffer. 100MB chunks finish
 * well within the timeout on broadband connections (~8s at 100Mbps, ~80s at
 * 10Mbps) and the snapshot/sandbox builder concatenates them back with `cat`.
 */
export const UPLOAD_CHUNK_SIZE_BYTES = 100 * 1024 * 1024;

/** Extracts the storage ID from Convex's upload URL response body. */
export function parseStorageIdResponse(text: string): Id<"_storage"> | null {
  try {
    const response = JSON.parse(text);
    return typeof response.storageId === "string" ? response.storageId : null;
  } catch {
    return null;
  }
}
