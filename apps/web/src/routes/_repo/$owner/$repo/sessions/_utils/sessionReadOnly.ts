export type SessionPrState = "draft" | "open" | "merged" | "closed";

/** PR terminal states — session is hard-locked until GitHub reopens the PR. */
export function isSessionPrReadOnly(
  prState: SessionPrState | undefined,
): boolean {
  return prState === "merged" || prState === "closed";
}

/**
 * Sidebar "active" list: not manually archived, and PR is still draft/open (or
 * no PR yet). Merged/closed land in the Archived collapsible instead.
 */
export function isSessionSidebarActive(session: {
  archived?: boolean;
  prState?: SessionPrState;
}): boolean {
  if (session.archived === true) return false;
  return !isSessionPrReadOnly(session.prState);
}

/**
 * Splits `sessions.list` + `sessions.listArchived` into sidebar buckets.
 * Terminal-PR rows still come from the non-archived query (flag may be false)
 * and are folded into the Archived group with manually archived sessions.
 */
export function partitionSessionsForSidebar<
  T extends {
    _id: string;
    archived?: boolean;
    prState?: SessionPrState;
    updatedAt?: number;
    _creationTime: number;
  },
>(
  nonArchivedQuery: T[] | undefined,
  archivedQuery: T[] | undefined,
): { active: T[] | undefined; archivedGroup: T[] | undefined } {
  if (nonArchivedQuery === undefined || archivedQuery === undefined) {
    return { active: undefined, archivedGroup: undefined };
  }

  const active = nonArchivedQuery.filter(isSessionSidebarActive);
  const terminal = nonArchivedQuery.filter((session) =>
    isSessionPrReadOnly(session.prState),
  );
  const archivedIds = new Set(archivedQuery.map((session) => session._id));
  const archivedGroup = [
    ...archivedQuery,
    ...terminal.filter((session) => !archivedIds.has(session._id)),
  ].sort(
    (a, b) =>
      (b.updatedAt ?? b._creationTime) - (a.updatedAt ?? a._creationTime),
  );

  return { active, archivedGroup };
}

/**
 * Banner copy for session read-only. PR closed/merged wins over archive so the
 * user sees why the session locked (reopen on GitHub unlocks again).
 */
export function getSessionReadOnlyMessage(args: {
  isArchived: boolean;
  prState: SessionPrState | undefined;
}): string | undefined {
  if (args.prState === "merged") {
    return "This PR has been merged, so this session is now read-only.";
  }
  if (args.prState === "closed") {
    return "This PR has been closed, so this session is now read-only.";
  }
  if (args.isArchived) {
    return "This session is archived and read-only";
  }
  return undefined;
}
