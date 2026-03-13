import type { Id, TableNames } from "@conductor/backend";
import type { SystemTableNames } from "convex/server";

export function isConvexId<T extends TableNames | SystemTableNames>(
  value: string,
): value is Id<T> {
  return value.length > 0;
}
