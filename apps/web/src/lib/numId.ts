/** Parses a TanStack route param into a positive integer numId, or null if invalid. */
export function parseRouteNumId(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

export type EntityResolveStatus = "loading" | "not-found" | "ready";

/** Outcome of turning a numId (or legacy Convex id) route param into a document. */
export type EntityResolveResult<TDoc extends { _id: string }> = {
  status: EntityResolveStatus;
  doc: TDoc | null;
  convexId: TDoc["_id"] | null;
  numId: number | null;
  /**
   * Canonical path when the param holds a legacy Convex id. Status stays
   * `loading` while this is set — the owning route renders the redirect.
   */
  redirectTo: string | null;
};

/**
 * Swaps a legacy Convex id segment for its numId, keeping the rest of the path.
 * Route-shape agnostic, so nested ids (`/projects/:id/:taskId`) each redirect on
 * their own without either one needing to know the other's route.
 */
export function replaceRouteIdSegment(
  pathname: string,
  legacyId: string,
  numId: number,
): string {
  return pathname
    .split("/")
    .map((segment) => (segment === legacyId ? String(numId) : segment))
    .join("/");
}

/** Human label for entity num ids: `#12` or `#12/34` when nested under a project. */
export function formatEntityNumLabel(options: {
  numId?: number;
  projectNumId?: number;
}): string | null {
  const { numId, projectNumId } = options;
  if (numId === undefined) {
    return null;
  }
  if (projectNumId !== undefined) {
    return `#${projectNumId}/${numId}`;
  }
  return `#${numId}`;
}

/** URL path segment for an entity with a per-repo numId. */
export function entityPathSegment(entity: { numId?: number }): string | null {
  if (entity.numId === undefined) {
    return null;
  }
  return String(entity.numId);
}

/** First path segment after `basePath` (the numId in entity detail URLs). */
export function routeNumIdFromPath(
  pathname: string,
  basePath: string,
): string | null {
  const prefix = `${basePath}/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const segment = pathname.slice(prefix.length).split("/")[0];
  return segment.length > 0 ? segment : null;
}
