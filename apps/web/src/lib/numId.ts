/** Parses a TanStack route param into a positive integer numId, or null if invalid. */
export function parseRouteNumId(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
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
