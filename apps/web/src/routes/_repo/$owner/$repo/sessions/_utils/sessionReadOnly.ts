export type SessionPrState = "draft" | "open" | "merged" | "closed";

/** PR terminal states — session is hard-locked until GitHub reopens the PR. */
export function isSessionPrReadOnly(
  prState: SessionPrState | undefined,
): boolean {
  return prState === "merged" || prState === "closed";
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
