export type SessionPrState = "draft" | "open" | "merged" | "closed";

/**
 * Session still in the active sidebar / chrome-tab strip: only manual archive
 * removes it. PR merged/closed updates `prState` for badges but does not hide
 * or lock the session.
 */
export function isSessionSidebarActive(session: {
  archived?: boolean;
}): boolean {
  return session.archived !== true;
}

/** Banner copy when the session is manually archived (read-only). */
export function getSessionReadOnlyMessage(args: {
  isArchived: boolean;
}): string | undefined {
  if (args.isArchived) {
    return "This session is archived and read-only";
  }
  return undefined;
}
