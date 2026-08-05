import {
  isSessionPrReadOnly,
  isSessionSidebarActive,
  type SessionPrState,
} from "@/routes/_repo/$owner/$repo/sessions/_utils/sessionReadOnly";

export interface SessionTabLike {
  archived?: boolean;
  prState?: SessionPrState;
}

/**
 * Active tabs = not archived and PR not merged/closed.
 * Archived menu = manually archived ∪ PR-terminal (merged/closed) non-archived.
 */
export function partitionSessionsForChromeTabs<
  TActive extends SessionTabLike,
  TArchived extends SessionTabLike,
>(
  nonArchived: TActive[],
  archived: TArchived[],
): { active: TActive[]; archivedMenu: Array<TActive | TArchived> } {
  const active: TActive[] = [];
  const prTerminal: TActive[] = [];
  for (const session of nonArchived) {
    if (isSessionSidebarActive(session)) {
      active.push(session);
    } else if (isSessionPrReadOnly(session.prState)) {
      prTerminal.push(session);
    }
  }
  return {
    active,
    archivedMenu: [...prTerminal, ...archived],
  };
}
